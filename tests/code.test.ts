import { describe, it, expect } from "vitest";
import { validateAlias, generateCode } from "../lib/code";

describe("validateAlias", () => {
  it("menerima alias valid", () => {
    expect(validateAlias("promo-2024").ok).toBe(true);
    expect(validateAlias("abc_123").ok).toBe(true);
  });
  it("menolak terlalu pendek", () => {
    expect(validateAlias("ab").ok).toBe(false);
  });
  it("menolak terlalu panjang", () => {
    expect(validateAlias("a".repeat(33)).ok).toBe(false);
  });
  it("menolak karakter aneh", () => {
    expect(validateAlias("a/b?c").ok).toBe(false);
    expect(validateAlias("ab cd").ok).toBe(false);
  });
  it.each(["api", "admin", "login", "health", "robots.txt", "_next"])(
    "menolak reserved %s",
    (a) => {
      expect(validateAlias(a).ok).toBe(false);
    }
  );
  it("reserved dicek case-insensitive", () => {
    expect(validateAlias("ADMIN").ok).toBe(false);
  });
});

describe("generateCode", () => {
  it("7 karakter base62", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCode()).toMatch(/^[a-zA-Z0-9]{7}$/);
    }
  });
  it("hampir tidak pernah bentrok", () => {
    const codes = new Set(Array.from({ length: 500 }, generateCode));
    expect(codes.size).toBeGreaterThan(495);
  });
});
