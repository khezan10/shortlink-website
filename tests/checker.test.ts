import { describe, it, expect, vi, afterEach } from "vitest";
import { checkUrl } from "../lib/checker";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Reply = { status: number; location?: string };

function mockSeq(replies: Reply[]) {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const r = replies[Math.min(i++, replies.length - 1)];
      return {
        status: r.status,
        headers: {
          get: (k: string) => (k.toLowerCase() === "location" ? r.location ?? null : null),
        },
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    })
  );
}

// IP publik literal → tidak perlu DNS.
const T = "http://8.8.8.8/";

describe("checkUrl klasifikasi (plan 4.5)", () => {
  it("200 → alive", async () => {
    mockSeq([{ status: 200 }]);
    expect((await checkUrl(T)).status).toBe("alive");
  });

  it("301 ke tujuan publik → alive", async () => {
    mockSeq([{ status: 301, location: "http://1.1.1.1/x" }, { status: 200 }]);
    expect((await checkUrl(T)).status).toBe("alive");
  });

  it("403 → alive (server menjawab, membatasi bot)", async () => {
    mockSeq([{ status: 403 }]);
    expect((await checkUrl(T)).status).toBe("alive");
  });

  it("429 → alive", async () => {
    mockSeq([{ status: 429 }]);
    expect((await checkUrl(T)).status).toBe("alive");
  });

  it("404 → fail", async () => {
    mockSeq([{ status: 404 }]);
    expect((await checkUrl(T)).status).toBe("fail");
  });

  it("410 → fail", async () => {
    mockSeq([{ status: 410 }]);
    expect((await checkUrl(T)).status).toBe("fail");
  });

  it("500 → fail", async () => {
    mockSeq([{ status: 500 }]);
    expect((await checkUrl(T)).status).toBe("fail");
  });

  it("ENOTFOUND → fail", async () => {
    const e = new Error("getaddrinfo") as NodeJS.ErrnoException;
    e.code = "ENOTFOUND";
    vi.stubGlobal("fetch", vi.fn(async () => { throw e; }));
    expect((await checkUrl(T)).status).toBe("fail");
  });

  it("ECONNREFUSED → fail", async () => {
    const e = new Error("refused") as NodeJS.ErrnoException;
    e.code = "ECONNREFUSED";
    vi.stubGlobal("fetch", vi.fn(async () => { throw e; }));
    expect((await checkUrl(T)).status).toBe("fail");
  });

  it("timeout → fail setelah 1x retry", async () => {
    const e = new Error("timeout") as NodeJS.ErrnoException;
    e.code = "ETIMEDOUT";
    const f = vi.fn(async () => { throw e; });
    vi.stubGlobal("fetch", f);
    expect((await checkUrl(T)).status).toBe("fail");
    expect(f.mock.calls.length).toBeGreaterThan(1);
  });

  it("EAI_AGAIN → inconclusive", async () => {
    const e = new Error("dns temp") as NodeJS.ErrnoException;
    e.code = "EAI_AGAIN";
    vi.stubGlobal("fetch", vi.fn(async () => { throw e; }));
    expect((await checkUrl(T)).status).toBe("inconclusive");
  });

  it("redirect ke IP privat → fail (validasi tiap hop)", async () => {
    mockSeq([{ status: 302, location: "http://192.168.1.1/admin" }]);
    expect((await checkUrl(T)).status).toBe("fail");
  });

  it("redirect ke metadata cloud → fail", async () => {
    mockSeq([{ status: 307, location: "http://169.254.169.254/latest" }]);
    expect((await checkUrl(T)).status).toBe("fail");
  });
});
