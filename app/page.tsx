"use client";

import { useState, useEffect } from "react";

type Result =
  | { ok: true; code: string; shortUrl: string; url: string }
  | { ok: false; error: string };

const ERROR_ID: Record<string, string> = {
  INVALID_URL: "Link tidak valid. Awali dengan https:// ya.",
  INVALID_ALIAS: "Alias 3–32 karakter (huruf, angka, - _).",
  ALIAS_TAKEN: "Alias sudah dipakai, coba yang lain.",
  TARGET_UNREACHABLE: "Link tujuan tidak bisa diakses, periksa lagi.",
  CHECK_INCONCLUSIVE: "Pengecekan belum meyakinkan, coba lagi sebentar.",
  RATE_LIMITED: "Kebanyakan membuat link. Coba lagi nanti.",
  DUPLICATE_URL: "Link tujuan ini sudah pernah dibuat. Shortlink yang ada ditampilkan di bawah.",
  DB_UNAVAILABLE: "Database belum siap. Coba lagi sebentar.",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<Array<{code: string; shortUrl: string; url: string; clicks: number; createdAt: Date}>>([]);
  useEffect(() => {
    async function loadLinks() {
      try {
        const res = await fetch("/api/links?limit=50");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setLinks(data.links || []);
      } catch {
        setLinks([]);
      }
    }
    loadLinks();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, alias: alias || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, ...data });
        // refresh daftar link supaya tampilkan link baru
        (async () => {
          try {
            const r = await fetch("/api/links?limit=50");
            if (!r.ok) throw new Error("failed");
            const dat = await r.json();
            setLinks(dat.links || []);
          } catch {
            // abaikan gagal refresh
          }
        })();
      } else {
        setResult({ ok: false, error: data.error || "INVALID_URL" });
      }
    } catch {
      setResult({ ok: false, error: "CHECK_INCONCLUSIVE" });
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (result?.ok) {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="stage">
      <p className="eyebrow">▓▒░ pemendek link gratis</p>
      <h1 className="title">
        MZG<span className="dot">.</span>MY<span className="dot">.</span>ID
        <span className="caret">_</span>
      </h1>
      <p className="sub">
        Tempel link panjang, dapat link pendek. Link tujuan yang mati dihapus
        otomatis.
      </p>

      <form onSubmit={submit} className="form">
        <label className="label" htmlFor="url">
          link tujuan
        </label>
        <input
          id="url"
          className="input"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://contoh.com/halaman-panjang"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button
          type="button"
          className="toggle"
          onClick={() => setShowAlias((v) => !v)}
        >
          {showAlias ? "− sembunyikan alias" : "+ alias sendiri (opsional)"}
        </button>
        {showAlias && (
          <>
            <label className="label" htmlFor="alias">
              alias (3–32 karakter)
            </label>
            <input
              id="alias"
              className="input"
              type="text"
              autoComplete="off"
              placeholder="promo-ramadhan"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </>
        )}
        <button type="submit" className="btn" disabled={loading || !url.trim()}>
          {loading ? "mengecek link…" : "> pendekkan"}
        </button>
      </form>

      {result?.ok && (
        <div className="result" role="status">
          <a
            className="short"
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.shortUrl}
          </a>
          <button type="button" className="btn small" onClick={copy}>
            {copied ? "tersalin ✓" : "salin"}
          </button>
        </div>
      )}
      {result && !result.ok && (
        <p className="error" role="alert">
          {ERROR_ID[result.error] || "Terjadi kesalahan, coba lagi."}
        </p>
      )}

      {/* Daftar link terbaru di bawah hero */}
      <section className="links-list" aria-label="Daftar link terbaru">
        <h2 className="list-title">link terbaru</h2>
        {links.length > 0 ? (
          <ul className="link-grid">
            {links.map((l) => (
              <li key={l.code} className="link-card">
                <a className="link-short" href={l.shortUrl} target="_blank" rel="noopener noreferrer">
                  {l.shortUrl.replace(/^https?:\/\//, "")}
                </a>
                <span className="link-url" title={l.url}>
                  {l.url.length > 60 ? l.url.slice(0, 57) + "..." : l.url}
                </span>
                <span className="link-clicks">{l.clicks} klik</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="list-empty">belum ada link yang dibuat_</p>
        )}
      </section>
    </main>
  );
}
