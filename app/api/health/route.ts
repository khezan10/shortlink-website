import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    const msg = (err.message || "").toLowerCase();
    let reason = err.name;
    if (msg.includes("whitelist")) reason = "IP_NOT_WHITELISTED";
    else if (msg.includes("bad auth") || msg.includes("authentication failed")) reason = "AUTH_FAILED";
    else if (msg.includes("timed out") || msg.includes("etimedout")) reason = "CONNECT_TIMEOUT";
    else if (msg.includes("econnrefused")) reason = "CONNECTION_REFUSED";
    else if (msg.includes("getaddrinfo") || msg.includes("enotfound")) reason = "DNS_FAILED";
    // Log lengkap hanya ke Vercel, tidak pernah ke response publik.
    console.error("[health] db error:", err.name, "-", err.message);
    return NextResponse.json({ ok: false, reason }, { status: 500 });
  }
}
