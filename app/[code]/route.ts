import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getDb } from "@/lib/mongodb";
import { checkUrl } from "@/lib/checker";
import { siteConfig } from "@/lib/config";
import type { LinkDoc } from "@/lib/types";

const RESERVED = new Set([
  "api", "_next", "admin", "login", "health", "404", "favicon.ico",
  "robots.txt", "sitemap.xml", "about",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (RESERVED.has(code.toLowerCase())) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const db = await getDb();
  const col = db.collection<LinkDoc>("links");
  const doc = await col.findOne({ code });
  if (!doc) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Click atomik tanpa memperlambat redirect (fire-and-forget).
  col.updateOne(
    { _id: doc._id },
    { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } }
  ).catch(() => null);

  // Lazy check latar belakang bila basi — redirect tidak menunggu.
  const last = (doc.lastCheckedAt as Date) || new Date(0);
  if (Date.now() - last.getTime() > siteConfig.minRecheckHours * 3600 * 1000) {
    after(async () => {
      const r = await checkUrl(doc.url as string);
      if (r.status === "alive") {
        await col.updateOne(
          { _id: doc._id },
          { $set: { failCount: 0, lastCheckedAt: new Date() } }
        );
      } else if (r.status === "fail") {
        const fails = ((doc.failCount as number) || 0) + 1;
        if (fails >= siteConfig.deadStrikes) {
          console.info(`lazy: delete code=${doc.code} reason=${r.reason}`);
          await col.deleteOne({ _id: doc._id });
        } else {
          await col.updateOne(
            { _id: doc._id },
            { $set: { failCount: fails, lastCheckedAt: new Date() } }
          );
        }
      } else {
        await col.updateOne(
          { _id: doc._id },
          { $set: { lastCheckedAt: new Date() } }
        );
      }
    });
  }

  return NextResponse.redirect(doc.url as string, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
