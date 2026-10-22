import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { normalizeUrl, assertPublicHost } from "@/lib/url";
import { checkUrl } from "@/lib/checker";
import { generateCode, validateAlias } from "@/lib/code";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";
import { siteConfig } from "@/lib/config";
import type { LinkDoc } from "@/lib/types";

export async function POST(req: NextRequest) {
  // 1) Rate limit per IP.
  const ip = clientIp(req);
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter || 3600) } }
    );
  }

  // 2) Validasi input.
  let body: { url?: string; alias?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
  }
  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
  }

  let url: string;
  try {
    url = normalizeUrl(body.url);
  } catch {
    return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
  }

  let code: string;
  if (body.alias) {
    const v = validateAlias(body.alias);
    if (!v.ok) return NextResponse.json({ error: "INVALID_ALIAS" }, { status: 400 });
    code = body.alias;
  } else {
    code = generateCode();
  }

  // 3) Guard SSRF + loop.
  try {
    await assertPublicHost(new URL(url).hostname);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "SELF_HOST") return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
    return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
  }

  // 4) Checker: hanya alive yang disimpan.
  const check = await checkUrl(url);
  if (check.status === "fail") {
    return NextResponse.json({ error: "TARGET_UNREACHABLE", reason: check.reason }, { status: 422 });
  }
  if (check.status === "inconclusive") {
    return NextResponse.json({ error: "CHECK_INCONCLUSIVE" }, { status: 503 });
  }

  // 5) Simpan (retry bila kode acak bentrok; alias bentrok → 409).
  const db = await getDb();
  const col = db.collection<LinkDoc>("links");
  const now = new Date();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await col.insertOne({
        code,
        url,
        createdAt: now,
        lastCheckedAt: now,
        failCount: 0,
        clicks: 0,
      });
      const shortUrl = `${siteConfig.baseUrl.replace(/\/$/, "")}/${code}`;
      return NextResponse.json({ code, shortUrl, url }, { status: 201 });
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err?.code === 11000) {
        if (body.alias) {
          return NextResponse.json({ error: "ALIAS_TAKEN" }, { status: 409 });
        }
        code = generateCode(); // coba kode baru
        continue;
      }
      throw e;
    }
  }
  return NextResponse.json({ error: "CHECK_INCONCLUSIVE" }, { status: 503 });
}
