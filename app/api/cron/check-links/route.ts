import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { checkUrl } from "@/lib/checker";
import { siteConfig } from "@/lib/config";
import type { LinkDoc } from "@/lib/types";

export const maxDuration = 60;

const CONCURRENCY = 10;
const BATCH = 150;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = await getDb();
  const col = db.collection<LinkDoc>("links");

  // Retensi: link yang tidak dipakai (tanpa klik) selama N hari dihapus.
  const inactiveCutoff = new Date(
    Date.now() - siteConfig.inactivePurgeDays * 86400 * 1000
  );
  const purged = await col.deleteMany({
    $or: [
      { lastClickedAt: { $lt: inactiveCutoff } },
      { lastClickedAt: { $exists: false }, createdAt: { $lt: inactiveCutoff } },
    ],
  });

  const cutoff = new Date(Date.now() - siteConfig.minRecheckHours * 3600 * 1000);

  const docs = await col
    .find({ lastCheckedAt: { $lt: cutoff } })
    .sort({ lastCheckedAt: 1 })
    .limit(BATCH)
    .toArray();

  let alive = 0;
  let deleted = 0;
  let inconclusive = 0;

  // Proses dengan konkurensi terbatas.
  for (let i = 0; i < docs.length; i += CONCURRENCY) {
    const chunk = docs.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (doc) => {
        const r = await checkUrl(doc.url as string);
        if (r.status === "alive") {
          alive++;
          await col.updateOne(
            { _id: doc._id },
            { $set: { failCount: 0, lastCheckedAt: new Date() } }
          );
        } else if (r.status === "fail") {
          const fails = ((doc.failCount as number) || 0) + 1;
          if (fails >= siteConfig.deadStrikes) {
            deleted++;
            console.info(`cron: delete code=${doc.code} reason=${r.reason}`);
            await col.deleteOne({ _id: doc._id });
          } else {
            await col.updateOne(
              { _id: doc._id },
              { $set: { failCount: fails, lastCheckedAt: new Date() } }
            );
          }
        } else {
          inconclusive++;
          await col.updateOne(
            { _id: doc._id },
            { $set: { lastCheckedAt: new Date() } }
          );
        }
      })
    );
  }

  return NextResponse.json({
    checked: docs.length,
    alive,
    deleted,
    inconclusive,
    purged: purged.deletedCount,
  });
}
