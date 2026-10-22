import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    // Log ke Vercel (tidak memuat URI/password), balas nama error saja.
    console.error("[health] db error:", err.name, "-", err.message);
    return NextResponse.json({ ok: false, reason: err.name }, { status: 500 });
  }
}
