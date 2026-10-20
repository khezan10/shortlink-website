import { getDb } from "./mongodb";
import { hashIp } from "./url";
import type { RateLimitDoc } from "./types";

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limit = Number(process.env.CREATE_LIMIT_PER_HOUR || 10);
  const hour = new Date();
  hour.setMinutes(0, 0, 0);
  const key = `${hashIp(ip)}:${hour.toISOString()}`;

  const db = await getDb();
  const col = db.collection<RateLimitDoc>("rate_limits");
  const res = await col.findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expireAt: new Date(hour.getTime() + 2 * 3600 * 1000) },
    },
    { upsert: true, returnDocument: "after" }
  );
  const count = (res?.count as number) || 1;
  if (count > limit) {
    const retryAfter = Math.ceil((hour.getTime() + 3600 * 1000 - Date.now()) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }
  return { allowed: true };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
