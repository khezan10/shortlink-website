/**
 * E2E terhadap URL produksi. Dijalankan HANYA oleh GitHub Actions.
 * Semua data uji memakai alias berawalan "e2e-" dan dibersihkan di akhir.
 */
import { MongoClient } from "mongodb";

const base = (process.env.BASE_URL || "").replace(/\/$/, "");
const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "shortlink";
const cronSecret = process.env.CRON_SECRET || "";
const strikes = Number(process.env.DEAD_LINK_STRIKES || 2);
const limitPerHour = Number(process.env.CREATE_LIMIT_PER_HOUR || 10);

const run = Date.now().toString(36);
const codeOf = (s: string) => `e2e-${s}-${run}`;

let pass = 0;
let fail = 0;
const results: string[] = [];

function ok(name: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    results.push(`PASS ${name}`);
  } else {
    fail++;
    results.push(`FAIL ${name} ${extra}`);
  }
}

async function postLink(body: unknown) {
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const links = db.collection("links");

try {
  // 1) Health
  const health = await fetch(`${base}/api/health`);
  ok("health ok", health.ok, `status=${health.status}`);

  // 2) Buat link valid + redirect
  const goodAlias = codeOf("good");
  const created = await postLink({ url: "https://example.com", alias: goodAlias });
  ok("buat link valid → 201", created.status === 201, `status=${created.status}`);

  if (created.status === 201) {
    const r = await fetch(`${base}/${goodAlias}`, { redirect: "manual" });
    const loc = r.headers.get("location") || "";
    const cc = r.headers.get("cache-control") || "";
    ok("redirect 302", r.status === 302, `status=${r.status}`);
    ok("location benar", loc.includes("example.com"), loc);
    ok("cache-control no-store", cc.includes("no-store"), cc);
  }

  // 3) Domain mati → 422
  const dead = await postLink({ url: "https://domain-tidak-ada-123.invalid" });
  ok("domain mati → 422", dead.status === 422, `status=${dead.status}`);

  // 4a) Alias dobel → 409
  const dup = await postLink({ url: "https://example.com", alias: goodAlias });
  ok("alias dobel → 409", dup.status === 409, `status=${dup.status}`);

  // 4b) SSRF → 400
  for (const bad of ["http://127.0.0.1", "http://169.254.169.254", "http://[::1]"]) {
    const r = await postLink({ url: bad });
    ok(`SSRF ditolak ${bad}`, r.status === 400, `status=${r.status}`);
  }

  // 5) Cron tanpa secret → 401
  const cronNoAuth = await fetch(`${base}/api/cron/check-links`);
  ok("cron tanpa secret → 401", cronNoAuth.status === 401, `status=${cronNoAuth.status}`);

  // 6) Uji aturan hapus: sisipkan dokumen mati, lalu jalankan cron
  const deadCode = codeOf("dead");
  await links.insertOne({
    code: deadCode,
    url: "https://domain-tidak-ada-123.invalid",
    createdAt: new Date(),
    lastCheckedAt: new Date(0),
    failCount: strikes - 1,
    clicks: 0,
  });

  // 7) Uji link sehat tetap hidup
  const aliveCode = codeOf("alive");
  await links.insertOne({
    code: aliveCode,
    url: "https://example.com",
    createdAt: new Date(),
    lastCheckedAt: new Date(0),
    failCount: 0,
    clicks: 0,
  });

  const cronRes = await fetch(`${base}/api/cron/check-links`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const cronJson = await cronRes.json().catch(() => ({}));
  ok("cron dengan secret → 200", cronRes.status === 200, JSON.stringify(cronJson).slice(0, 120));

  const deadAfter = await links.findOne({ code: deadCode });
  ok("link mati terhapus dari DB", deadAfter === null);

  const deadPage = await fetch(`${base}/${deadCode}`, { redirect: "manual" });
  ok("GET link mati → 404", deadPage.status === 404, `status=${deadPage.status}`);

  const aliveAfter = await links.findOne({ code: aliveCode });
  ok(
    "link sehat tetap ada & failCount=0",
    aliveAfter !== null && (aliveAfter.failCount as number) === 0,
    JSON.stringify({ exists: !!aliveAfter, failCount: aliveAfter?.failCount })
  );

  // 8) Index sesuai 4.3
  const idx = await links.listIndexes().toArray();
  const codeIdx = idx.find((i) => i.key && (i.key as Record<string, number>).code === 1);
  ok("index unik {code:1}", !!codeIdx && !!codeIdx.unique);
  ok(
    "index {lastCheckedAt:1}",
    idx.some((i) => i.key && (i.key as Record<string, number>).lastCheckedAt === 1)
  );

  const rlIdx = await db.collection("rate_limits").listIndexes().toArray();
  ok(
    "TTL index rate_limits",
    rlIdx.some(
      (i) => i.key && (i.key as Record<string, number>).expireAt === 1 && i.expireAfterSeconds === 0
    )
  );

  // 9) Rate limit (paling akhir, sekali saja)
  const burst = await Promise.all(
    Array.from({ length: limitPerHour + 1 }, () =>
      fetch(`${base}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      }).then((r) => r.status)
    )
  );
  ok(
    `rate limit: ada 429 setelah ${limitPerHour + 1} request`,
    burst.includes(429),
    `status=${JSON.stringify(burst)}`
  );
} catch (e) {
  fail++;
  results.push(`FAIL exception: ${(e as Error).message}`);
} finally {
  // 10) Bersihkan semua data uji
  const del = await links.deleteMany({ code: { $regex: "^e2e-" } });
  results.push(`cleanup: ${del.deletedCount} dokumen uji dihapus`);
  await client.close();
}

console.log(results.join("\n"));
console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
