import { describe, it, expect, beforeAll } from "vitest";
import { normalizeUrl, assertPublicHost, isBlockedIP } from "../lib/url";

beforeAll(() => {
  process.env.NEXT_PUBLIC_BASE_URL = "https://mzg.my.id";
});

describe("normalizeUrl", () => {
  it("menambah https bila tanpa skema", () => {
    expect(normalizeUrl("contoh.com/x")).toBe("https://contoh.com/x");
  });
  it("menerima http/https", () => {
    expect(normalizeUrl("http://a.com/")).toBe("http://a.com/");
    expect(normalizeUrl("https://a.com/")).toBe("https://a.com/");
  });
  it("menolak javascript:", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow();
  });
  it("menolak ftp:", () => {
    expect(() => normalizeUrl("ftp://x.com")).toThrow();
  });
  it("menolak userinfo", () => {
    expect(() => normalizeUrl("http://user:pass@x.com")).toThrow();
  });
  it("menolak URL > 2048", () => {
    expect(() => normalizeUrl("https://x.com/" + "a".repeat(2048))).toThrow();
  });
  it("membuang hash", () => {
    expect(normalizeUrl("https://a.com/p#x")).toBe("https://a.com/p");
  });
});

describe("isBlockedIP", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.5.4",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "::1",
    "::",
  ])("memblokir %s", (ip) => {
    expect(isBlockedIP(ip)).toBe(true);
  });
  it("melewatkan IP publik", () => {
    expect(isBlockedIP("8.8.8.8")).toBe(false);
    expect(isBlockedIP("1.1.1.1")).toBe(false);
  });
});

describe("assertPublicHost", () => {
  it("menolak localhost", async () => {
    await expect(assertPublicHost("localhost")).rejects.toThrow();
  });
  it("menolak 127.0.0.1", async () => {
    await expect(assertPublicHost("127.0.0.1")).rejects.toThrow();
  });
  it("menolak 169.254.169.254", async () => {
    await expect(assertPublicHost("169.254.169.254")).rejects.toThrow();
  });
  it("menolak [::1]", async () => {
    await expect(assertPublicHost("::1")).rejects.toThrow();
  });
  it("menolak host sendiri", async () => {
    await expect(assertPublicHost("mzg.my.id")).rejects.toThrow();
  });
});
