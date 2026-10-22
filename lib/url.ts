import { createHash } from "crypto";
import dns from "dns/promises";
import net from "net";

const MAX_LEN = 2048;
const RESERVED = new Set([
  "api", "_next", "admin", "login", "health", "404", "favicon.ico",
  "robots.txt", "sitemap.xml", "about",
]);

// CIDR privat/loopback/link-local/metadata yang wajib ditolak (anti-SSRF).
const BLOCKED_CIDRS: Array<[string, number]> = [
  ["127.0.0.0", 8],
  ["10.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["169.254.0.0", 16],
  ["0.0.0.0", 8],
];

function ipToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inCidr(ip: string, base: string, bits: number): boolean {
  const a = ipToInt(ip);
  const b = ipToInt(base);
  if (a === null || b === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (a & mask) === (b & mask);
}

export function isBlockedIPv4(ip: string): boolean {
  return BLOCKED_CIDRS.some(([base, bits]) => inCidr(ip, base, bits));
}

export function isBlockedIP(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 0) return false;
  if (v === 6) {
    const low = ip.toLowerCase();
    // ::1, ::, 0.0.0.0-mapped, fc00::/7, fe80::/10
    if (low === "::1" || low === "::") return true;
    if (low.startsWith("fc") || low.startsWith("fd")) return true;
    if (low.startsWith("fe80") || low.startsWith("fe90") || low.startsWith("fea") || low.startsWith("feb")) return true;
    return false;
  }
  return isBlockedIPv4(ip);
}

export function normalizeUrl(input: string): string {
  let s = input.trim();
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = "https://" + s;
  const u = new URL(s);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("INVALID_SCHEME");
  }
  if (u.username || u.password) throw new Error("INVALID_USERINFO");
  if (s.length > MAX_LEN) throw new Error("TOO_LONG");
  u.hash = "";
  return u.toString();
}

export function selfHost(): string | null {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function assertNotSelf(hostname: string): void {
  const self = selfHost();
  if (self && (hostname.toLowerCase() === self || hostname.toLowerCase().endsWith("." + self))) {
    throw new Error("SELF_HOST");
  }
}

export async function assertPublicHost(hostname: string): Promise<void> {
  assertNotSelf(hostname);
  const host = hostname.toLowerCase();
  if (host === "localhost") throw new Error("BLOCKED_HOST");
  if (net.isIP(host) !== 0) {
    if (isBlockedIP(host)) throw new Error("BLOCKED_HOST");
    return;
  }
  // Resolve DNS dulu, tolak bila mengarah ke IP privat.
  const [v4, v6] = await Promise.all([
    dns.resolve4(host).catch(() => [] as string[]),
    dns.resolve6(host).catch(() => [] as string[]),
  ]);
  const all = [...v4, ...v6];
  if (all.length === 0) throw new Error("DNS_FAIL");
  if (all.some(isBlockedIP)) throw new Error("BLOCKED_HOST");
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "dev-salt";
  return createHash("sha256").update(salt + ":" + ip).digest("hex").slice(0, 32);
}

export { RESERVED };
