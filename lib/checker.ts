import dns from "dns/promises";
import net from "net";
import { isBlockedIP } from "./url";

export type CheckResult = {
  status: "alive" | "fail" | "inconclusive";
  reason: string;
};

const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 5;
const UA = "mzg-shortlink-checker/1.0";

async function fetchOnce(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: ctrl.signal,
      headers: { "User-Agent": UA },
    });
  } finally {
    clearTimeout(t);
  }
}

async function hostIPs(hostname: string): Promise<string[]> {
  const host = hostname.toLowerCase();
  if (host === "localhost") return ["127.0.0.1"];
  if (net.isIP(host) !== 0) return [host];
  const [v4, v6] = await Promise.all([
    dns.resolve4(host).catch(() => [] as string[]),
    dns.resolve6(host).catch(() => [] as string[]),
  ]);
  return [...v4, ...v6];
}

async function hopBlocked(rawUrl: string): Promise<boolean> {
  try {
    const u = new URL(rawUrl);
    const ips = await hostIPs(u.hostname).catch(() => [] as string[]);
    return ips.length === 0 || ips.some(isBlockedIP);
  } catch {
    return true;
  }
}

/** Klasifikasi persis plan 4.5. Timeout di-retry 1x. */
export async function checkUrl(rawUrl: string): Promise<CheckResult> {
  let url = rawUrl;
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        if (await hopBlocked(url)) {
          return { status: "fail", reason: "BLOCKED_HOST" };
        }
        let res: Response;
        try {
          res = await fetchOnce(url, "HEAD");
        } catch {
          res = await fetchOnce(url, "GET");
        }
        const st = res.status;
        // Redirect manual: validasi ulang tiap hop.
        if (st >= 300 && st < 400) {
          const loc = res.headers.get("location");
          if (!loc) return { status: "fail", reason: `HTTP_${st}_NO_LOCATION` };
          url = new URL(loc, url).toString();
          await res.arrayBuffer().catch(() => null);
          continue;
        }
        await res.arrayBuffer().catch(() => null);
        if (st < 400) return { status: "alive", reason: `HTTP_${st}` };
        if (st === 404 || st === 410) return { status: "fail", reason: `HTTP_${st}` };
        if (st >= 500) return { status: "fail", reason: `HTTP_${st}` };
        // 401/403/429 & 4xx lain: server menjawab, hanya membatasi bot → alive.
        return { status: "alive", reason: `HTTP_${st}` };
      }
      return { status: "fail", reason: "TOO_MANY_REDIRECTS" };
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException & { name?: string };
      lastError = err?.code || err?.name || "FETCH_ERROR";
      if (lastError === "EAI_AGAIN") {
        return { status: "inconclusive", reason: lastError };
      }
      const retryable = ["ETIMEDOUT", "ECONNRESET", "AbortError", "TIMEOUT"];
      if (attempt === 0 && (retryable.includes(lastError) || /abort/i.test(lastError))) {
        continue; // retry 1x
      }
      // DNS ENOTFOUND, ECONNREFUSED, TLS error, 5xx-hop → fail.
      return { status: "fail", reason: lastError };
    }
  }
  return { status: "fail", reason: lastError || "FETCH_ERROR" };
}
