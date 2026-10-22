import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { normalizeUrl, assertPublicHost } from "@/lib/url";
import { checkUrl } from "@/lib/checker";
import { generateCode, validateAlias } from "@/lib/code";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";
import { siteConfig } from "@/lib/config";
import type { LinkDoc } from "@/lib/types";

function shortUrlFor(code: string): string {
  return `${siteConfig.baseUrl.replace(/\/$/, "")}/${code}`;
}

/** GET /api/links — daftar link terbaru (untuk daftar di bawah hero). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(q || "50", 10) || 50, 1), 200);
  try {
    const db = await getDb();
    const docs = await db
      .collection<LinkDoc>("links")
      .find({}, { projection: { _id: 0, code: 1, url: 1, clicks: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json(
      {
        links: docs.map((d) => ({
          code: d.code,
          shortUrl: shortUrlFor(d.code),
          url: d.url,
          clicks: d.clicks ?? 0,
          createdAt: d.createdAt,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ links: [], error: "DB_UNAVAILABLE" }, { status: 503 });
  }
}

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

  // 5) Tolak duplikat URL tujuan — kembalikan shortlink yang sudah ada.
  const db = await getDb();
  const col = db.collection<LinkDoc>("links");
  const existing = await col.findOne({ url }, { projection: { code: 1 } });
  if (existing) {
    return NextResponse.json(
      {
        error: "DUPLICATE_URL",
        code: existing.code,
        shortUrl: shortUrlFor(existing.code),
        url,
      },
      { status: 409 }
    );
  }

  // 6) Simpan (retry bila kode acak bentrok; alias bentrok → 409).
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
      const err = e as { code?: number; keyPattern?: Record<string, unknown> };
      if (err?.code === 11000) {
        // Cek apakah duplikat terjadi pada url atau code
        const keyPattern: Record<string, unknown> = err.keyPattern || {};
        if (keyPattern && (keyPattern as { url?: unknown }).url) {
          // Duplikat URL — kembalikan shortlink yang sudah ada
          const col2 = (await getDb()).collection<LinkDoc>("links");
          const dup = await col2.findOne({ url }, { projection: { code: 1 } });
          if (dup) {
            return NextResponse.json(
              { error: "DUPLICATE_URL", code: dup.code, shortUrl: shortUrlFor(dup.code), url },
              { status: 409 }
            );
          }
        }
        if (body.alias) return NextResponse.json({ error: "ALIAS_TAKEN" }, { status: 409 });
        code = generateCode(); // coba kode baru
        continue;
      }
      throw e;
    }
  }
  return NextResponse.json({ error: "CHECK_INCONCLUSIVE" }, { status: 503 });
}
