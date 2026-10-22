import { MongoClient, type Db } from "mongodb";

const dbName = process.env.MONGODB_DB || "shortlink";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
  var __mongoIndexesPromise: Promise<void> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI belum disetel");
  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = new MongoClient(uri).connect();
  }
  return global.__mongoClientPromise;
}

/** Index sesuai plan 4.3. Idempoten, dijalankan sekali per instance. */
export function ensureIndexes(db: Db): Promise<void> {
  if (!global.__mongoIndexesPromise) {
    global.__mongoIndexesPromise = (async () => {
      await db.collection("links").createIndex({ code: 1 }, { unique: true });
      await db.collection("links").createIndex({ lastCheckedAt: 1 });
      try {
        await db.collection("links").createIndex({ url: 1 }, { unique: true });
      } catch {
        // Data lama mungkin sudah berduplikat — fallback index biasa.
        await db.collection("links").createIndex({ url: 1 });
      }
      await db
        .collection("rate_limits")
        .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    })();
  }
  return global.__mongoIndexesPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  const db = client.db(dbName);
  await ensureIndexes(db);
  return db;
}
