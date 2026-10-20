// Membuat index MongoDB sesuai plan 4.3 (idempoten).
// Jalankan: npx tsx scripts/ensure-indexes.ts  (butuh MONGODB_URI di env)
import { getDb } from "../lib/mongodb";

const db = await getDb();
await db.collection("links").createIndex({ code: 1 }, { unique: true });
await db.collection("links").createIndex({ lastCheckedAt: 1 });
await db
  .collection("rate_limits")
  .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
console.log("indexes OK");
process.exit(0);
