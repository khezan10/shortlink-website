"use client";

import { useState, useEffect, useRef } from "react";

type Result =
  | { ok: true; code: string; shortUrl: string; url: string }
  | { ok: false; error: string };

const ERROR_ID: Record<string, string> = {
  INVALID_URL: "Invalid link. Start it with https://",
  INVALID_ALIAS: "Alias must be 3–32 characters (letters, numbers, - _).",
  ALIAS_TAKEN: "That alias is taken, try another one.",
  TARGET_UNREACHABLE: "The destination is unreachable, please check it.",
  CHECK_INCONCLUSIVE: "The check was inconclusive, try again shortly.",
  RATE_LIMITED: "Too many links created. Try again later.",
  DUPLICATE_URL: "This destination already exists. Its short link is listed below.",
  DB_UNAVAILABLE: "Database is not ready. Try again shortly.",
};

const TITLE = "MZG.MY.ID";

const SUB_LINES = [
  "Paste a long link, get a short one. Dead destinations are removed automatically.",
  "One link per destination. Duplicates are rejected, idle links are purged after 7 days.",
  "No account, no cost, no ads. Just paste and shorten.",
];

const BOOT_WORDS = ["booting mzg", "loading fonts", "preparing form", "ready"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<Array<{code: string; shortUrl: string; url: string; clicks: number; createdAt: Date}>>([]);
  const [listError, setListError] = useState(false);

  const [entered, setEntered] = useState(false);
  const bootRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const revealRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    async function loadLinks() {
      try {
        const res = await fetch("/api/links?limit=50");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setLinks(data.links || []);
        setListError(false);
      } catch {
        setLinks([]);
        setListError(true);
      }
    }
    loadLinks();
  }, []);

  // Loader ala Zanara: progres nyata (font + waktu minimum), lalu fade keluar.
  useEffect(() => {
    const loader = bootRef.current;
    const pctEl = pctRef.current;
    const wordEl = wordRef.current;
    const barEl = barRef.current;
    if (!loader || !pctEl || !wordEl || !barEl) {
      setEntered(true);
      return;
    }

    let wi = 0;
    const wordTimer = setInterval(() => {
      wi = Math.min(wi + 1, BOOT_WORDS.length - 1);
      wordEl.textContent = BOOT_WORDS[wi];
    }, 620);

    let fontReady = false;
    let minTime = false;
    let displayed = 0;
    let done = false;
    let raf = 0;
    let hardStop: ReturnType<typeof setTimeout> | undefined;

    const minTimer = setTimeout(() => {
      minTime = true;
    }, 1000);

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          fontReady = true;
        })
        .catch(() => {
          fontReady = true;
        });
    } else {
      fontReady = true;
    }

    const target = () => ((fontReady ? 1 : 0) + (minTime ? 1 : 0)) / 2;

    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(wordTimer);
      clearTimeout(minTimer);
      if (hardStop) clearTimeout(hardStop);
      pctEl.textContent = "100%";
      barEl.style.width = "100%";
      loader.style.transition = "opacity .5s ease";
      loader.style.opacity = "0";
      setTimeout(() => setEntered(true), 480);
    };

    // Jaring pengaman: rAF melambat saat tab tidak aktif, loader tetap harus selesai.
    hardStop = setTimeout(() => {
      fontReady = true;
      minTime = true;
      finish();
    }, 2400);

    const tick = () => {
      displayed += (target() - displayed) * 0.14;
      if (target() >= 1) displayed = Math.min(1, displayed + 0.05);
      pctEl.textContent = `${Math.round(displayed * 100)}%`;
      barEl.style.width = `${Math.round(displayed * 100)}%`;
      if (target() < 1 || displayed < 0.995) {
        raf = requestAnimationFrame(tick);
        return;
      }
      finish();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(wordTimer);
      clearTimeout(minTimer);
      if (hardStop) clearTimeout(hardStop);
    };
  }, []);

  // Entrance: huruf naik + unblur bertahap, lalu section menyusul.
  useEffect(() => {
    if (!entered) return;
    const title = titleRef.current;
    if (title) {
      const chars = Array.from(title.querySelectorAll<HTMLElement>(".ch"));
      chars.forEach((el) => {
        el.style.opacity = "0";
        el.style.filter = "blur(8px)";
        el.style.transform = "translateY(22px)";
        el.style.transition = "none";
      });
      requestAnimationFrame(() => {
        chars.forEach((el, i) => {
          el.style.transition =
            "opacity .7s ease, filter .7s ease, transform .7s cubic-bezier(.23,1,.32,1)";
          el.style.transitionDelay = `${0.05 + i * 0.045}s`;
          el.style.opacity = "1";
          el.style.filter = "blur(0)";
          el.style.transform = "translateY(0)";
        });
      });
      chars.forEach((el) => {
        el.style.textShadow = "0 0 10px rgba(180,255,43,0.22)";
        el.addEventListener("pointerenter", () => {
          el.animate(
            [
              { transform: "translateY(0px)" },
              { transform: "translateY(-18px)" },
              { transform: "translateY(0px)" },
            ],
            { duration: 520, easing: "cubic-bezier(.23,1,.32,1)" }
          );
        });
      });
    }
    revealRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transitionDelay = `${0.12 + i * 0.12}s`;
      el.classList.add("in");
    });
  }, [entered]);

  // Sub berganti kalimat: ketik → tahan → hapus, kursor ▌ berkedip.
  useEffect(() => {
    if (!entered) return;
    const sub = subRef.current;
    const node = sub?.firstChild;
    if (!sub || !node || node.nodeType !== Node.TEXT_NODE) return;
    const text = node as Text;
    let li = 0;
    let ci = SUB_LINES[0].length;
    let phase: "hold" | "erase" | "type" = "hold";
    let holdUntil = performance.now() + 3400;
    const id = setInterval(() => {
      if (document.hidden) return;
      const now = performance.now();
      if (phase === "hold") {
        if (now < holdUntil) return;
        phase = "erase";
        return;
      }
      if (phase === "erase") {
        ci -= 2;
        if (ci <= 0) {
          ci = 0;
          li = (li + 1) % SUB_LINES.length;
          phase = "type";
        }
        text.textContent = SUB_LINES[li].slice(0, ci);
        return;
      }
      ci += 1;
      if (ci >= SUB_LINES[li].length) {
        ci = SUB_LINES[li].length;
        phase = "hold";
        holdUntil = now + 3400;
      }
      text.textContent = SUB_LINES[li].slice(0, ci);
    }, 45);
    return () => clearInterval(id);
  }, [entered]);

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
    <>
      {!entered && (
        <div id="boot" ref={bootRef} aria-hidden="true">
          <div className="boot-inner">
            <div className="boot-line">
              <span ref={wordRef}>booting mzg</span>
              <span ref={pctRef}>0%</span>
            </div>
            <div className="boot-bar">
              <i ref={barRef} />
            </div>
          </div>
        </div>
      )}

      <main className="stage">
        <p className="eyebrow">▓▒░ free link shortener</p>
        <h1 className="title" ref={titleRef} aria-label="MZG.MY.ID">
          {Array.from(TITLE).map((ch, i) => (
            <span key={i} className={ch === "." ? "ch dot" : "ch"} aria-hidden="true">
              {ch}
            </span>
          ))}
          <span className="ch caret" aria-hidden="true">_</span>
        </h1>
        <p className="sub" ref={subRef}>
          Paste a long link, get a short one. Dead destinations are removed automatically.
          <span className="type-caret" aria-hidden="true">▌</span>
        </p>

        <form
          onSubmit={submit}
          className="form reveal"
          ref={(el) => {
            revealRefs.current[0] = el;
          }}
        >
          <label className="label" htmlFor="url">
            destination url
          </label>
          <input
            id="url"
            className="input"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://example.com/long-page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setShowAlias((v) => !v)}
          >
            {showAlias ? "− hide alias" : "+ custom alias (optional)"}
          </button>
          {showAlias && (
            <>
              <label className="label" htmlFor="alias">
                alias (3–32 characters)
              </label>
              <input
                id="alias"
                className="input"
                type="text"
                autoComplete="off"
                placeholder="ramadan-promo"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </>
          )}
          <button type="submit" className="btn" disabled={loading || !url.trim()}>
            {loading ? "checking link…" : "> shorten"}
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
              {copied ? "copied ✓" : "copy"}
            </button>
          </div>
        )}
        {result && !result.ok && (
          <p className="error" role="alert">
            {ERROR_ID[result.error] || "Something went wrong, try again."}
          </p>
        )}

        {/* Daftar link terbaru di bawah hero */}
        <section
          className="links-list reveal"
          aria-label="Latest links"
          ref={(el) => {
            revealRefs.current[1] = el;
          }}
        >
          <h2 className="list-title">latest links</h2>
          {links.length > 0 ? (
            <ul className="link-grid">
              {links.map((l, i) => (
                <li
                  key={l.code}
                  className="link-card"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <a className="link-short" href={l.shortUrl} target="_blank" rel="noopener noreferrer">
                    {l.shortUrl.replace(/^https?:\/\//, "")}
                  </a>
                  <span className="link-url" title={l.url}>
                    {l.url.length > 60 ? l.url.slice(0, 57) + "..." : l.url}
                  </span>
                  <span className="link-clicks">{l.clicks} clicks</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="list-empty">
              {listError
                ? "database not connected — try again shortly"
                : "no links yet_"}
            </p>
          )}
        </section>
      </main>
    </>
  );
}
