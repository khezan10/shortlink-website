import { describe, it, expect, vi, beforeEach } from "vitest";

const findOneAndUpdate = vi.fn();

vi.mock("../lib/mongodb", () => ({
  getDb: vi.fn(async () => ({
    collection: () => ({ findOneAndUpdate }),
  })),
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    findOneAndUpdate.mockReset();
    process.env.CREATE_LIMIT_PER_HOUR = "3";
    process.env.IP_HASH_SALT = "test-salt";
  });

  it("mengizinkan selama di bawah batas", async () => {
    findOneAndUpdate.mockResolvedValue({ count: 2 });
    const { checkRateLimit } = await import("../lib/ratelimit");
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(true);
  });

  it("menolak saat melewati batas + Retry-After", async () => {
    findOneAndUpdate.mockResolvedValue({ count: 4 });
    const { checkRateLimit } = await import("../lib/ratelimit");
    const r = await checkRateLimit("1.2.3.4");
    expect(r.allowed).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  it("hash IP, bukan IP mentah, yang jadi key", async () => {
    findOneAndUpdate.mockResolvedValue({ count: 1 });
    const { checkRateLimit } = await import("../lib/ratelimit");
    await checkRateLimit("9.9.9.9");
    const filter = findOneAndUpdate.mock.calls[0][0] as { _id: string };
    expect(filter._id).not.toContain("9.9.9.9");
    expect(filter._id.length).toBeGreaterThan(32);
  });

  it("upsert + TTL expireAt", async () => {
    findOneAndUpdate.mockResolvedValue({ count: 1 });
    const { checkRateLimit } = await import("../lib/ratelimit");
    await checkRateLimit("1.1.1.1");
    const update = findOneAndUpdate.mock.calls[0][1] as {
      $inc: { count: number };
      $setOnInsert: { expireAt: Date };
    };
    expect(update.$inc.count).toBe(1);
    expect(update.$setOnInsert.expireAt instanceof Date).toBe(true);
  });
});
