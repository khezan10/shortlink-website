# plan.md — Shortlink Website + Section Project di Zanara

> Dokumen ini adalah **sumber kebenaran tugas**. Status dan temuan ditulis di `progress.md`, bukan di sini.
> **Mode kerja: CLOUD-ONLY** — kode di **GitHub**, build + hosting di **Vercel**, pengujian di **GitHub Actions**, data di **MongoDB Atlas**. Tidak ada server/DB lokal.
> Prompt awal untuk agent: *"Baca `progress.md`, ambil tugas berikutnya, kerjakan sesuai `plan.md`, tulis temuanmu ke `progress.md`."*

---

## 0. Tujuan

| Kode | Deliverable | Hasil akhir |
|------|-------------|-------------|
| **A** | **Shortlink Website** gratis | Live di `https://mzg.my.id`, kode di GitHub public `khezan10/shortlink-website`, deploy di Vercel, data di MongoDB Atlas, ada README |
| **B** | **Section "Project"** di landing page Zanara | Repo `khezan10/zanara-project` (live: `https://zanara-project.vercel.app`): hero tepat 1 layar, di bawahnya kartu project dengan animasi mengetik kode |

"Sampai listing" ditafsirkan sebagai: aplikasi sudah **live di domain** *dan* **terdaftar sebagai kartu** di landing page Zanara (Deliverable B). Kerjakan A dulu, lalu B.

### Definisi selesai (global)
- [ ] `https://mzg.my.id` terbuka (HTTPS valid), bisa membuat shortlink, dan shortlink me-redirect dengan benar.
- [ ] Link tujuan tak bisa diakses → **tidak bisa dibuat**; yang sudah ada dan mati → **dihapus dari database** (lihat 4.5).
- [ ] Repo `shortlink-website` public, README lengkap, **tidak ada secret** di file maupun riwayat git.
- [ ] Landing Zanara: hero tepat 1 layar; kartu project muncul saat di-scroll dengan animasi mengetik; Three.js dan animasi loading lama tetap jalan.
- [ ] Semua verifikasi dilakukan di **GitHub Actions / URL Vercel**, bukan di localhost.
- [ ] `progress.md` terisi rapi: semua tugas berstatus `DONE`/`SKIPPED` (dengan alasan), URL final tercatat.

---

## 1. Protokol Kerja Agent (WAJIB)

1. **Mulai dengan membaca `progress.md` sampai habis.** Tugas aktif = tugas berstatus `DOING`; jika tidak ada, ambil tugas `TODO` pertama (urut ID) yang semua dependensinya (`Butuh:`) sudah `DONE`.
2. **Satu tugas satu waktu.** Baca bagian tugas itu di `plan.md`, kerjakan, buktikan dengan hasil nyata (log CI, respons dari URL Vercel).
3. **Tulis ke `progress.md` sebelum pindah tugas:** ubah status di tabel, tambah entri log (format di bawah), catat temuan, keputusan, dan blocker.
4. **Commit kecil dan sering** (Conventional Commits, mis. `feat: ...`, `fix: ...`, `docs: ...`). `progress.md` ikut di-commit bersama kode tugasnya.
5. **BLOCKED (butuh user):** tulis di bagian *Butuh Tindakan User* pada `progress.md` — apa yang dibutuhkan, di mana, dan langkah persisnya. Lanjutkan tugas lain yang tidak bergantung. Jika semuanya bergantung, **berhenti dan laporkan**.
6. **Jangan mengarang.** URL, hasil tes, dan angka harus dari output nyata. Cantumkan ringkasan output pendek sebagai bukti.
7. **Jangan ubah `plan.md`** kecuali menemukan kesalahan nyata. Jika terpaksa, catat di *Perubahan Plan* pada `progress.md` (apa, mengapa).
8. **Tanpa aksi destruktif tanpa izin:** jangan hapus repo, jangan ubah/hapus record DNS yang sudah ada, jangan drop database/koleksi milik user.
9. **Aturan secret (repo ini PUBLIC):**
   - Jangan pernah mencetak, mengutip, atau menulis nilai `MONGODB_URI`, `MONGODB_PASSWORD`, `CRON_SECRET`, `IP_HASH_SALT`, token apa pun — **tidak di log, `progress.md`, commit, issue, maupun README**. Saat melaporkan error, buang URI dari pesannya.
   - File `atlas-credentials.env` **tidak boleh masuk repo** dan **tidak disalin ke `.env.local`**. Nilainya hanya dimuat ke variabel shell sementara untuk dikirim lewat *stdin* ke Vercel dan GitHub Secrets (lihat A2), lalu di-`unset`.
   - Gunakan `.env.example` (nama variabel saja, tanpa nilai asli).

### 1.1 Prinsip Cloud-Only

| Hal | Aturan |
|-----|--------|
| **Folder kerja** | Hanya untuk menulis berkas dan `git push`. Itu tidak bisa dihindari, tetapi **tidak ada aplikasi yang dijalankan di sana**. |
| **Dilarang** | `npm run dev`, `next start`, `npm run build` lokal, MongoDB/Docker lokal, menguji lewat `localhost`, menyimpan `.env.local`. |
| **Boleh** | `npm install` / scaffolding (`create-next-app`) **hanya** untuk membuat berkas dan `package-lock.json`; `git`, `gh`, `npx vercel` (link, env, domain, log), `curl` ke URL publik, `dig`, `openssl`. |
| **Build & hosting** | Dijalankan Vercel. Pantau lewat `npx vercel ls`, `npx vercel inspect <url> --logs`, `npx vercel logs <url>`. |
| **Tes** | Dijalankan GitHub Actions (`ci.yml` untuk lint/typecheck/unit test; `e2e.yml` untuk uji terhadap URL Vercel). Pantau lewat `gh run list`, `gh run watch`, `gh run view --log-failed`. |
| **Secret** | Disimpan di **Vercel Environment Variables** dan **GitHub Actions Secrets** (hanya yang dibutuhkan workflow). Tidak ada di berkas. |
| **Verifikasi** | Terhadap **URL produksi** (`https://<project>.vercel.app`, lalu `https://mzg.my.id`). URL *Preview* Vercel bisa diproteksi (401) — jangan jadikan satu-satunya sasaran uji. |

**Alur tiap perubahan:** tulis kode → commit → push → tunggu **CI hijau** (`gh run watch`) dan **deployment Vercel `READY`** → uji URL → catat di `progress.md`. Build/CI gagal → baca log (`gh run view --log-failed`, `npx vercel inspect <url> --logs`), perbaiki, push lagi.

**Deliverable A** belum punya pengguna sebelum rilis, jadi boleh langsung push ke `main`. **Deliverable B** menyentuh situs yang sudah live, jadi gunakan **branch + PR**, merge hanya setelah CI hijau; jika produksi rusak → `git revert` atau `npx vercel rollback` segera.

### Format entri log di `progress.md`

```
### [ID] Judul tugas — STATUS — YYYY-MM-DD HH:MM
**Dikerjakan:** apa yang dilakukan (singkat)
**Temuan:** hal penting/tak terduga, versi tool, batasan platform
**Bukti:** perintah + ringkasan output/log CI/respons URL (tanpa secret)
**Keputusan:** pilihan yang diambil dan alasannya
**Next:** langkah/tugas berikutnya
```

Status: `TODO` · `DOING` · `DONE` · `BLOCKED` · `SKIPPED` (wajib ada alasan).

---

## 2. Keputusan & Asumsi

| ID | Keputusan | Catatan |
|----|-----------|---------|
| D1 | Hosting **Vercel Hobby**, DB **MongoDB Atlas M0**, DNS **Cloudflare Free** — semuanya gratis | Domain `mzg.my.id` sudah milik user |
| D2 | Domain pendek di **apex** `mzg.my.id` (`mzg.my.id/abc123`), `www` diarahkan ke apex | Jika apex sudah dipakai layanan lain → STOP, tanya user (alternatif: `s.mzg.my.id`) |
| D3 | **Cloudflare hanya untuk DNS.** `cloudflared`/Tunnel **tidak dipakai** karena hosting di Vercel | Record DNS diset **DNS only** (awan abu-abu) |
| D4 | Stack: **Next.js** (App Router) + TypeScript + Tailwind, driver resmi `mongodb`, test dengan Vitest | Pakai versi stabil terbaru |
| D5 | Redirect **302** (bukan 301/308) + `Cache-Control: no-store` | Agar link yang dihapus benar-benar berhenti bekerja dan tidak di-cache |
| D6 | **Tanpa login/akun.** Perlindungan penyalahgunaan: rate limit per IP + validasi ketat | Tidak ada fitur edit/hapus manual |
| D7 | Nama repo & project Vercel: `shortlink-website` (slug dari "shortlink website") | GitHub tidak mengizinkan spasi |
| D8 | UI berbahasa Indonesia; README Indonesia + ringkasan Inggris; lisensi MIT | |
| D9 | **Ambang hapus link mati = 2 kegagalan beruntun** (`DEAD_LINK_STRIKES=2`), minimal berjarak 6 jam | Mencegah link sehat terhapus karena gangguan sesaat. Set `1` untuk hapus pada kegagalan pertama |
| D10 | **Cloud-only** (lihat 1.1): tes di GitHub Actions, verifikasi di URL Vercel, index database dibuat **otomatis saat runtime** (bukan lewat skrip lokal) | |

---

## 3. Prasyarat & Akses

| Kebutuhan | Cara cek | Jika tidak ada |
|-----------|----------|----------------|
| `git`, `gh`, Node (hanya untuk scaffolding/lockfile) | `git --version`, `gh --version`, `node -v` | Pasang |
| GitHub CLI login | `gh auth status` | User: `gh auth login` |
| Vercel CLI login | `npx vercel whoami` (atau env `VERCEL_TOKEN`) | User: `npx vercel login` |
| **Vercel GitHub integration** terpasang untuk akun/repo | `vercel git connect` berhasil | User: pasang Vercel GitHub App dan beri akses ke repo `shortlink-website` / `zanara-project`. Fallback sementara: `npx vercel --prod --yes` (build tetap di Vercel) |
| Kredensial Atlas | file `atlas-credentials.env` berisi `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_URI` | User sediakan |
| Cloudflare (opsional) | `CLOUDFLARE_API_TOKEN` (izin *Zone → DNS → Edit*, hanya zona `mzg.my.id`) + `CLOUDFLARE_ZONE_ID` | Mode manual: user menambah DNS record sendiri |

---

## 4. Spesifikasi Teknis — Deliverable A

### 4.1 Struktur proyek

```
shortlink-website/
├─ app/
│  ├─ page.tsx                    # beranda: form pembuat shortlink
│  ├─ [code]/ (route.ts | page.tsx)   # redirect + 404 kustom
│  ├─ not-found.tsx
│  └─ api/
│     ├─ links/route.ts           # POST buat link
│     ├─ cron/check-links/route.ts# GET pembersih link mati (dilindungi CRON_SECRET)
│     └─ health/route.ts          # GET cek kesehatan (ping DB)
├─ lib/  config.ts · mongodb.ts (termasuk ensureIndexes) · url.ts · checker.ts · code.ts · ratelimit.ts
├─ scripts/  e2e.ts               # dijalankan HANYA oleh GitHub Actions
├─ tests/                         # unit test (Vitest)
├─ .github/workflows/  ci.yml · e2e.yml
├─ .env.example · .gitignore · vercel.json · LICENSE · README.md · plan.md · progress.md
```

### 4.2 Variabel lingkungan

| Nama | Wajib | Contoh/Default | Disimpan di |
|------|-------|----------------|-------------|
| `MONGODB_URI` | ✔ | (dari file kredensial) | Vercel + GitHub Secrets |
| `MONGODB_DB` | | `shortlink` | Vercel (+ GitHub Variables) |
| `NEXT_PUBLIC_BASE_URL` | ✔ | `https://mzg.my.id` | Vercel (di-*inline* saat build → ubah = redeploy) |
| `CRON_SECRET` | ✔ | `openssl rand -hex 32` | Vercel + GitHub Secrets |
| `IP_HASH_SALT` | ✔ | `openssl rand -hex 32` | Vercel |
| `DEAD_LINK_STRIKES` | | `2` | Vercel |
| `MIN_RECHECK_HOURS` | | `6` | Vercel |
| `CREATE_LIMIT_PER_HOUR` | | `10` | Vercel |

Vercel mengirim `Authorization: Bearer <CRON_SECRET>` ke endpoint cron secara otomatis bila variabel `CRON_SECRET` ada.

### 4.3 Model data (database `shortlink`)

**`links`**
```
{ _id, code: string (unik), url: string, createdAt: Date,
  lastCheckedAt: Date, failCount: number (0), clicks: number (0), lastClickedAt?: Date }
```
Index: `{code:1}` **unique**; `{lastCheckedAt:1}`.

**`rate_limits`**
```
{ _id: "<ipHash>:<jamKe>", count: number, expireAt: Date }
```
Index: `{expireAt:1}` dengan `expireAfterSeconds: 0` (TTL).

Index dibuat oleh `ensureIndexes()` (idempoten, `createIndex` aman dipanggil berulang) yang dijalankan **sekali per instance** sebelum operasi DB pertama.

### 4.4 Kontrak API

**`POST /api/links`** — body `{ "url": "https://contoh.com/halaman", "alias": "opsional" }`

| Status | Body | Kapan |
|--------|------|-------|
| 201 | `{ code, shortUrl, url }` | Berhasil |
| 400 | `{ error: "INVALID_URL" \| "INVALID_ALIAS" }` | Input tidak valid |
| 409 | `{ error: "ALIAS_TAKEN" }` | Alias sudah dipakai/reserved |
| 422 | `{ error: "TARGET_UNREACHABLE", reason }` | Tujuan tidak bisa diakses → **tidak disimpan** |
| 429 | `{ error: "RATE_LIMITED" }` + `Retry-After` | Terlalu banyak permintaan |
| 503 | `{ error: "CHECK_INCONCLUSIVE" }` | Pengecekan tak meyakinkan, minta coba lagi |

**`GET /[code]`** — 302 ke `url` (+ `Cache-Control: no-store`); kode tak ada → halaman 404 kustom. Menambah `clicks` secara atomik (`$inc`) tanpa memperlambat redirect.

**`GET /api/cron/check-links`** — wajib header Bearer `CRON_SECRET`, selain itu 401. Respons: `{ checked, alive, deleted, inconclusive }`.

**`GET /api/health`** — `{ ok: true }` jika ping DB berhasil.

### 4.5 Aturan Link Mati (inti produk)

Hasil `checkUrl(url)` ada tiga:

| Hasil | Kondisi |
|-------|---------|
| **alive** | Ada respons HTTP status < 400, **atau** 401/403/429 dan 4xx lain selain 404/410 (server menjawab, hanya membatasi bot) |
| **fail** | DNS `ENOTFOUND`, koneksi ditolak/reset, timeout (setelah 1× retry), error TLS, HTTP **404/410**, HTTP **5xx**, atau host kini mengarah ke IP privat |
| **inconclusive** | `EAI_AGAIN` (gangguan DNS sementara) atau error dari sisi server kita sendiri |

Penerapan:
1. **Saat membuat link:** hanya `alive` yang disimpan. `fail` → 422, `inconclusive` → 503.
2. **Saat cron / pengecekan latar belakang:**
   - `alive` → `failCount = 0`, `lastCheckedAt = now`
   - `fail` → `failCount += 1`; jika `failCount >= DEAD_LINK_STRIKES` → **`deleteOne` (hapus permanen, tanpa tombstone)**
   - `inconclusive` → hanya `lastCheckedAt = now`
3. Satu link tidak dihitung gagal lebih dari sekali dalam `MIN_RECHECK_HOURS`.
4. Penghapusan dicatat ke log fungsi (`console.info`: kode + host + alasan, **tanpa** URL penuh dan tanpa secret).
5. Teknis pengecekan: `HEAD` dulu; jika status ≥ 400 atau method ditolak → ulangi dengan `GET` (hentikan setelah header diterima, body diabaikan). Timeout 6 detik, maks 5 redirect, `User-Agent` jelas (mis. `mzg-shortlink-checker/1.0`).

### 4.6 Keamanan (wajib)

- **Validasi URL:** hanya `http:`/`https:`, maks 2048 karakter, tanpa `user:pass@`, normalisasi host, tolak URL yang host-nya = host `NEXT_PUBLIC_BASE_URL` (cegah loop).
- **Anti-SSRF** (server kita yang melakukan fetch ke URL buatan user): resolve DNS lebih dulu, tolak IP loopback/privat/link-local/metadata (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`, `0.0.0.0`), dan **validasi ulang di setiap hop redirect**.
- **Alias:** `^[a-zA-Z0-9_-]{3,32}$`, tolak kata terlarang: `api`, `_next`, `admin`, `login`, `health`, `404`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `about`.
- **Kode acak:** 7 karakter base62 (mis. `nanoid` custom alphabet); jika bentrok, coba ulang maks 5×.
- **Rate limit** per hash IP (`sha256(ip + IP_HASH_SALT)`); IP dari `x-forwarded-for` (elemen pertama) atau `x-real-ip`.
- Header keamanan dasar (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`) lewat `next.config`.
- *(Opsional, bila waktu)* Cloudflare Turnstile pada form atau Google Safe Browsing API untuk menolak URL berbahaya.

---

## 5. Daftar Tugas — Deliverable A

### Fase 0 — Persiapan

**P0.1 Cek tools & login** · Butuh: –
- Jalankan `git --version`, `gh --version`, `node -v`, `gh auth status`, `npx vercel whoami`. Catat versi.
- Belum login → `BLOCKED`, minta user menjalankan `gh auth login` dan `npx vercel login`.
- **Selesai jika:** versi dan status login tercatat.

**P0.2 Cek berkas kredensial Atlas (tanpa membocorkan)** · Butuh: –
- Cari `atlas-credentials.env`. Cek **hanya keberadaan** tiga nama variabel (`grep -c '^MONGODB_URI=' berkas` dll.). **Jangan** `cat`/`echo` nilainya dan **jangan** menguji koneksi dari mesin ini — koneksi dibuktikan lewat `/api/health` di Vercel (A4).
- **Selesai jika:** berkas ditemukan, tiga variabel ada, lokasi berkas (tanpa isi) tercatat.

**P0.3 Cek Cloudflare & DNS** · Butuh: –
- `dig +short NS mzg.my.id` (harus nameserver Cloudflare), `dig +short A mzg.my.id`, `dig +short CNAME www.mzg.my.id`. Catat record yang sudah ada.
- Cek ada/tidaknya `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` → tentukan **mode otomatis** atau **mode manual** untuk A14.
- Apex sudah dipakai layanan lain → **STOP**, tanya user (lihat D2).
- **Selesai jika:** kondisi DNS dan mode (otomatis/manual) tercatat.

### Fase 1 — GitHub & Vercel

**A1 Scaffold berkas proyek (tanpa menjalankan lokal)** · Butuh: P0.1
- Buat proyek Next.js (`npx create-next-app@latest shortlink-website`: TypeScript, App Router, Tailwind, ESLint). Tambah dependensi: `mongodb`, `nanoid`; devDependencies: `vitest`, `tsx`. Tambah skrip npm: `lint`, `test` (`vitest run`). `npm install` hanya untuk membuat `package-lock.json`.
- `.gitignore` wajib memuat `.env*` (kecuali `.env.example`), `node_modules`, `.next`, `.vercel`, `*.env`, `atlas-credentials*`.
- Buat `.env.example` (nama variabel dari 4.2, nilai kosong).
- Buat `.github/workflows/ci.yml` (lihat lampiran 9.3): `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm test` pada setiap push/PR.
- Salin `plan.md` dan `progress.md` ke root repo.
- **Selesai jika:** berkas lengkap, `git ls-files` tidak memuat `.env*` selain `.env.example`, dan **tidak ada** `.env.local`.

**A2 Repo GitHub public + project Vercel + environment + deploy awal** · Butuh: A1, P0.2
1. **Secret scan:** `git ls-files | xargs grep -nE "mongodb(\+srv)?://|MONGODB_PASSWORD" || echo bersih` harus bersih.
2. `gh repo create khezan10/shortlink-website --public --source=. --remote=origin --description "Pemendek link gratis di mzg.my.id — otomatis menghapus link tujuan yang mati" --push`. Tambah topics: `shortlink`, `url-shortener`, `nextjs`, `mongodb`, `vercel`.
3. **Vercel:** `npx vercel link --yes --project shortlink-website`, lalu `npx vercel git connect` (agar push ke `main` otomatis deploy). Gagal terhubung → lihat Prasyarat (Vercel GitHub App) / `BLOCKED`.
4. **Environment (tanpa mencetak nilai)** — muat nilai ke variabel shell sementara, kirim lewat stdin, lalu `unset`:
   ```bash
   set -a; . "$LOKASI_ATLAS_ENV"; set +a
   printf %s "$MONGODB_URI" | npx vercel env add MONGODB_URI production
   printf %s "$MONGODB_URI" | gh secret set MONGODB_URI
   CRON_SECRET=$(openssl rand -hex 32)
   printf %s "$CRON_SECRET" | npx vercel env add CRON_SECRET production
   printf %s "$CRON_SECRET" | gh secret set CRON_SECRET
   openssl rand -hex 32 | npx vercel env add IP_HASH_SALT production
   unset MONGODB_URI MONGODB_USERNAME MONGODB_PASSWORD CRON_SECRET
   ```
   Lalu tambah variabel non-rahasia (`MONGODB_DB`, `DEAD_LINK_STRIKES`, `MIN_RECHECK_HOURS`, `CREATE_LIMIT_PER_HOUR`) dan `NEXT_PUBLIC_BASE_URL` (sementara = URL produksi `*.vercel.app`). Preview env opsional; jika dipakai, gunakan `MONGODB_DB=shortlink_preview`.
5. Push; tunggu deployment `READY`.
- **Selesai jika:** repo public terlihat di GitHub; `npx vercel env ls` menampilkan **nama** variabel yang dibutuhkan (tanpa nilai); `gh secret list` menampilkan `MONGODB_URI` dan `CRON_SECRET`; push memicu deployment dan CI; URL produksi tercatat di `progress.md`.

### Fase 2 — Database

**A3 Hardening Atlas** · Butuh: P0.2
- Vercel memakai IP dinamis → di Atlas *Network Access* perlu allowlist `0.0.0.0/0` (M0 tidak mendukung private networking). Jika agent tak punya akses (Atlas CLI/API) → `BLOCKED` **sekarang juga** dengan langkah rinci untuk user: *Atlas → Security → Network Access → Add IP Address → Allow Access From Anywhere*. Lanjutkan tugas lain (A5–A7) selagi menunggu.
- Rekomendasi: **user database khusus** dengan role `readWrite` hanya pada database `shortlink` (jangan pakai user admin onboarding di produksi). Bila dibuat, perbarui `MONGODB_URI` di Vercel dan GitHub Secrets (lewat stdin, tanpa dicetak).
- Password harus kuat; user dipersilakan merotasinya setelah proyek rampung.
- **Selesai jika:** status Network Access dan user DB tercatat.

**A4 Koneksi MongoDB & index otomatis** · Butuh: A2, A3 · file: `lib/mongodb.ts`, `app/api/health/route.ts`
- `lib/mongodb.ts`: `MongoClient` yang di-cache global (aman untuk serverless); untuk Vercel Fluid Compute gunakan pola yang direkomendasikan dokumentasi Vercel terbaru (mis. `attachDatabasePool` dari `@vercel/functions`) — **verifikasi di dokumentasi sebelum memakai**.
- `ensureIndexes()` membuat index sesuai 4.3, dipanggil sekali per instance (cache *promise*) sebelum operasi DB pertama.
- `GET /api/health` melakukan ping + `ensureIndexes()`.
- **Selesai jika:** setelah push dan deployment `READY`, `curl -s https://<produksi>/api/health` → `{"ok":true}`. Respons error/timeout → periksa A3 (allowlist IP) dan catat diagnosis (tanpa URI). Verifikasi index dilakukan oleh `e2e.ts` (A12/A13).

### Fase 3 — Backend inti

**A5 Validasi URL & guard SSRF** · Butuh: A2 · file: `lib/url.ts`
- Implementasi aturan 4.6 (skema, panjang, userinfo, host sendiri, IP privat termasuk hasil resolve DNS dan IPv6). Fungsi: `normalizeUrl(input)`, `assertPublicHost(hostname)`.
- Tulis unit test (`tests/url.test.ts`) minimal untuk: `javascript:`, `ftp:`, `http://localhost`, `http://127.0.0.1`, `http://169.254.169.254`, `http://[::1]`, `http://user:pass@x.com`, URL > 2048, host sendiri.
- **Selesai jika:** CI hijau (`gh run watch`).

**A6 Checker URL** · Butuh: A5 · file: `lib/checker.ts`
- Implementasi `checkUrl(url)` → `{ status: "alive" | "fail" | "inconclusive", reason }` persis sesuai 4.5 (HEAD→GET fallback, redirect manual dengan validasi ulang tiap hop, timeout 6 dtk, retry 1× untuk timeout).
- Unit test dengan `fetch`/DNS ter-mock: 200→alive, 301→alive, 403→alive, 404→fail, 410→fail, 500→fail, `ENOTFOUND`→fail, timeout→fail, `EAI_AGAIN`→inconclusive, redirect ke IP privat→fail.
- **Selesai jika:** CI hijau.

**A7 Generator kode & alias** · Butuh: A2 · file: `lib/code.ts`
- `generateCode()` (7 char base62), `validateAlias(alias)`, daftar kata terlarang (4.6). Unit test alias valid/invalid/terlarang.
- **Selesai jika:** CI hijau.

**A8 `POST /api/links` + rate limit** · Butuh: A4, A5, A6, A7 · file: `app/api/links/route.ts`, `lib/ratelimit.ts`
- Urutan: rate limit → validasi input → `checkUrl` → simpan (retry bila kode bentrok; alias bentrok → 409) → 201. Rate limit pakai `rate_limits` + TTL (`findOneAndUpdate` `$inc`, upsert). Respons sesuai 4.4. Tidak mencetak URL penuh atau secret ke log.
- Unit test logika rate limit dengan koleksi tiruan.
- **Selesai jika:** CI hijau, deployment `READY`, dan satu panggilan nyata ke produksi berhasil: `curl -s -X POST https://<produksi>/api/links -H 'content-type: application/json' -d '{"url":"https://example.com","alias":"e2e-manual-1"}'` → 201. *(Jangan menguji 429 secara manual — itu membuat IP agent terkena limit; diuji oleh e2e di A12/A13.)* Catat alias uji untuk dibersihkan di A13.

**A9 Redirect `/[code]`** · Butuh: A4, A6
- 302 + `Cache-Control: no-store`; `clicks` bertambah atomik. Kode tak dikenal/reserved → 404 kustom.
- **Pengecekan latar belakang (lazy check):** jika `lastCheckedAt` lebih lama dari `MIN_RECHECK_HOURS`, jalankan `checkUrl` *setelah* respons dikirim (`after()` dari `next/server`, atau `waitUntil` dari `@vercel/functions` bila `after()` tak tersedia) dan terapkan 4.5. **Redirect tidak boleh menunggu pengecekan.**
- **Selesai jika:** deployment `READY`; `curl -sI https://<produksi>/e2e-manual-1` → `302`, `location: https://example.com/`, `cache-control` memuat `no-store`; kode acak ngawur → 404.

**A10 Cron pembersih link mati** · Butuh: A6, A9 · file: `app/api/cron/check-links/route.ts`, `vercel.json`
- Endpoint menolak tanpa `Authorization: Bearer ${CRON_SECRET}` (401).
- Ambil batch link terurut `lastCheckedAt` paling lama (mis. 100–200), proses dengan konkurensi terbatas (±10), dengan anggaran waktu (berhenti sebelum batas durasi fungsi; set `export const maxDuration`). Terapkan 4.5 dan kembalikan ringkasan.
- `vercel.json`: `{ "crons": [{ "path": "/api/cron/check-links", "schedule": "0 3 * * *" }] }`. **Verifikasi batas cron paket Hobby di dokumentasi Vercel saat ini** (selama ini maks sekali per hari) dan sesuaikan; catat di `progress.md`.
- **Selesai jika:** deployment `READY`; `curl -s -o /dev/null -w "%{http_code}" https://<produksi>/api/cron/check-links` → `401`. Perilaku hapus dibuktikan oleh e2e (A13). Pendaftaran cron di dashboard Vercel (*Settings → Cron Jobs*) dicatat; bila agent tak bisa memeriksa → masukkan ke *Butuh Tindakan User* sebagai langkah verifikasi.

### Fase 4 — Antarmuka

**A11 UI beranda, 404, metadata** · Butuh: A8
- Beranda: judul, input URL (otomatis menambah `https://` bila tanpa skema), alias opsional (dilipat), tombol buat, hasil `shortUrl` + tombol **Salin** (umpan balik "Tersalin"), state loading, pesan error ramah untuk tiap kode di 4.4 (mis. 422 → "Link tujuan tidak bisa diakses, periksa lagi").
- Teks kecil aturan: *"Link tujuan yang mati akan dihapus otomatis."*
- 404 kustom: "Link tidak ditemukan atau sudah dihapus."
- Responsif (360 px → desktop), dark mode, label form dan fokus keyboard (aksesibel), `<title>`, deskripsi, favicon (emoji/SVG), Open Graph dasar. Tampilan bersih dan sederhana.
- **Selesai jika:** deployment `READY`; `curl -s https://<produksi>/` → 200 dan memuat form; pemeriksaan visual/perilaku dilakukan oleh uji Playwright di `e2e.yml` (viewport 360×800 dan 1440×900: tanpa scroll horizontal, alur buat → hasil → tombol Salin) — tambahkan di A12.

### Fase 5 — Pengujian otomatis (GitHub Actions)

**A12 Siapkan uji otomatis di GitHub Actions** · Butuh: A5–A11
- Pastikan `ci.yml` hijau (lint, typecheck, unit test semua modul).
- Buat `.github/workflows/e2e.yml` (lihat 9.4): `workflow_dispatch` dengan input `base_url`; menjalankan `scripts/e2e.ts` di runner. **Pass `base_url` lewat `env`, bukan interpolasi langsung di perintah shell.**
- `scripts/e2e.ts` (semua data uji memakai alias berawalan `e2e-`):
  1. `/api/health` ok
  2. buat link valid → 201; `GET shortUrl` (tanpa mengikuti redirect) → 302, `location` benar, `no-store`
  3. buat link `https://domain-tidak-ada-123.invalid` → **422**
  4. alias dobel → 409; input SSRF (`http://127.0.0.1`, `http://169.254.169.254`, `http://[::1]`) → 400
  5. cron tanpa secret → 401
  6. **Uji aturan hapus:** sisipkan dokumen `e2e-dead-<acak>` (tujuan `.invalid`, `failCount = STRIKES-1`, `lastCheckedAt` = epoch) langsung ke DB dengan `MONGODB_URI`; panggil cron dengan `CRON_SECRET`; pastikan dokumen **terhapus** dan `GET /e2e-dead-...` → 404
  7. **Uji link sehat tetap hidup:** sisipkan `e2e-alive-<acak>` (tujuan `https://example.com`, `lastCheckedAt` = epoch); setelah cron, dokumen masih ada dan `failCount = 0`
  8. periksa index (`listIndexes`) sesuai 4.3
  9. **Uji rate limit (paling akhir, sekali saja):** kirim `CREATE_LIMIT_PER_HOUR + 1` permintaan → permintaan terakhir 429
  10. **Bersihkan:** `deleteMany({ code: { $regex: "^e2e-" } })`; keluar dengan kode ≠ 0 bila ada langkah gagal
- Tambahkan uji UI Playwright ringan (A11) bila memungkinkan di runner.
- **Selesai jika:** `ci.yml` hijau dan `e2e.yml` sudah ada di `main` (`gh workflow list` menampilkannya). Eksekusinya di A13.

### Fase 6 — Rilis

**A13 Rilis produksi pertama & verifikasi di Vercel** · Butuh: A12, A4
- Pastikan deployment `main` terbaru `READY` (`npx vercel ls`), `NEXT_PUBLIC_BASE_URL` benar.
- Jalankan: `gh workflow run e2e.yml -f base_url=https://<produksi>.vercel.app`, lalu `gh run watch` dan baca hasilnya (`gh run view --log`). Gagal → analisis, perbaiki, push, ulangi.
- Bersihkan data uji manual dari A8/A9 (`e2e-manual-*`) lewat langkah cleanup e2e (pastikan regex mencakup).
- **Selesai jika:** `e2e.yml` hijau terhadap URL produksi `*.vercel.app`; ringkasan hasil tiap langkah tercatat.

**A14 Domain `mzg.my.id`** · Butuh: A13, P0.3
- Tambah domain ke project Vercel (`npx vercel domains add mzg.my.id` atau dashboard) + `www.mzg.my.id` (redirect ke apex).
- **Gunakan record persis yang ditampilkan Vercel** untuk domain tersebut (dashboard *Settings → Domains* / `npx vercel domains inspect mzg.my.id`). Fallback umum: `A  @  76.76.21.21` dan `CNAME  www  cname.vercel-dns.com`.
- Cloudflare: record **DNS only** (awan abu-abu). Mode otomatis → lewat Cloudflare API; mode manual → `BLOCKED` dengan daftar record yang harus ditambah user. **Jangan menghapus/mengubah record lain yang sudah ada.**
- Perbarui `NEXT_PUBLIC_BASE_URL=https://mzg.my.id` di Vercel, lalu picu redeploy (`git commit --allow-empty -m "chore: redeploy dengan domain produksi" && git push`).
- Tunggu propagasi (`dig`, `npx vercel domains inspect`) hingga konfigurasi valid.
- **Selesai jika:** `curl -I https://mzg.my.id` → 200 dengan sertifikat valid; `https://www.mzg.my.id` mengarah ke apex.

### Fase 7 — Dokumentasi & verifikasi akhir

**A15 README, LICENSE, metadata repo** · Butuh: A13 (A14 untuk link demo final)
- `README.md` (Indonesia, plus ringkasan Inggris 3–4 baris): judul + deskripsi satu kalimat · tautan demo `https://mzg.my.id` · fitur · **aturan link mati** (termasuk ambang 2× gagal & cara mengubahnya) · stack · arsitektur singkat · struktur folder · **cara deploy sendiri ke Vercel** (tombol *Deploy with Vercel* dengan daftar env, cara membuat database di Atlas, domain di Cloudflare) · tabel env (tanpa nilai asli) · referensi API (4.4) · keamanan (SSRF, rate limit) · batasan paket gratis · pengembangan lokal **singkat dan opsional untuk kontributor** (agent tidak menjalankannya) · kontribusi · lisensi.
- Tambah `LICENSE` (MIT, pemilik: Khezan). Isi *About* repo: deskripsi, website `https://mzg.my.id`, topics.
- **Selesai jika:** README bisa diikuti dari nol oleh orang lain; tidak ada secret/URI di dalamnya.

**A16 Uji E2E pada domain produksi** · Butuh: A14
- `gh workflow run e2e.yml -f base_url=https://mzg.my.id`, pantau sampai selesai. Seluruh langkah (termasuk uji hapus dan rate limit) harus hijau.
- Periksa header redirect pada domain: tidak ada `x-vercel-cache: HIT` pada respons 302 (`curl -sI https://mzg.my.id/<kode>`).
- Pastikan tidak tersisa data `e2e-*` di DB (langkah cleanup e2e berhasil).
- **Selesai jika:** e2e hijau terhadap `https://mzg.my.id`, bukti tercatat.

**A17 Audit keamanan final & rilis** · Butuh: A16, A15
- Secret scan seluruh riwayat: `git log -p --all | grep -nE "mongodb(\+srv)?://[^ ]*:[^ ]*@|MONGODB_PASSWORD=[^<]" || echo bersih`. Pastikan `git ls-files` tidak memuat `.env*` (selain `.env.example`) maupun `atlas-credentials*`. Periksa log GitHub Actions terbaru: tidak ada nilai rahasia yang bocor.
- Jika **ada secret bocor**: hentikan, catat di *Butuh Tindakan User* (rotasi password Atlas), jangan push lagi sebelum dibersihkan.
- Buat tag `v1.0.0` dan `gh release create v1.0.0 --generate-notes`.
- **Selesai jika:** bersih, tag/release terbit.

---

## 6. Spesifikasi — Deliverable B (Landing Zanara)

**Repo:** `khezan10/zanara-project` · **Live:** `https://zanara-project.vercel.app`

**Kondisi awal yang harus dipertahankan:** landing playful tanpa menu/navigasi, hanya tulisan "Zanara Project", animasi Three.js, dan animasi loading. Semua itu **tidak boleh rusak**.

### 6.1 Hero tepat 1 layar
- Tinggi hero `100svh` (fallback `100vh`, boleh `100dvh`), tanpa margin/padding body yang menambah tinggi. Kanvas Three.js menyesuaikan ukuran saat resize/rotasi.
- Saat halaman dimuat, **hanya hero yang terlihat**; section project baru terlihat setelah di-scroll.
- *(Opsional, kecil)* indikator scroll halus (mis. tanda panah/teks "scroll") agar orang tahu ada konten di bawah — hanya jika tidak mengganggu tampilan playful.

### 6.2 Section "Project"
- Berada tepat di bawah hero. Judul bergaya komentar kode, mis. `// yang saya buat`.
- Grid kartu: 1 kolom (mobile), 2 kolom (≥ 768 px), 3 kolom (≥ 1100 px) bila jumlah kartu cukup.
- **Kartu simpel**, bergaya jendela kode (font monospace, border tipis, sudut membulat). Isi kartu persis tiga hal:
  1. **Nama project**
  2. **Link ke website** (anchor sungguhan, `target="_blank"` + `rel="noopener noreferrer"`)
  3. **Penjelasan singkat 5–10 kata** (hitung kata; di luar rentang → perbaiki)
- Contoh tampilan kartu (diketik seperti kode):

```js
const project = {
  nama: "Shortlink",
  link: "mzg.my.id",
  tentang: "Pemendek link gratis yang otomatis menghapus link mati.",
};
```

### 6.3 Animasi mengetik
- Pemicu: `IntersectionObserver` saat section ≥ ~30% terlihat, **sekali saja** (tidak mengulang saat scroll naik-turun).
- Teks muncul **karakter demi karakter** (±20–35 ms/karakter, sedikit acak), kursor berkedip mengikuti posisi ketik; antar-kartu berurutan (jeda ±250 ms). Seluruh animasi satu kartu ≲ 3 detik.
- Pewarnaan sintaks sederhana (kata kunci, nama properti, string, tanda baca).
- Implementasi disarankan: render **seluruh teks di HTML** dengan tiap karakter dalam `<span>` yang disingkapkan bertahap → layout tidak bergeser, teks tetap ada di DOM (SEO + pembaca layar).
- `prefers-reduced-motion: reduce` → tampilkan teks lengkap langsung tanpa animasi. Tanpa JavaScript → teks lengkap tetap terbaca.

### 6.4 Data project
Simpan di satu berkas data (mis. `projects.js`/`.json`/`.ts` sesuai stack) agar mudah menambah kartu.

| Project | Link | Draf penjelasan (5–10 kata) | Status |
|---------|------|------------------------------|--------|
| Shortlink | `https://mzg.my.id` | Pemendek link gratis yang otomatis menghapus link mati. | **Pasti** (dibuat di Deliverable A) |
| MeowPhoto | *tanya user* | Galeri web ala Google Photos dari grup Telegram. | Kandidat |
| Nekodldr | *tanya user* | Bot Telegram untuk mengunduh media dari link. | Kandidat |
| nekostore | *tanya user* | Bot Telegram toko untuk menjual produk digital. | Kandidat |
| Photobooth | *tanya user* | Website photobooth untuk berfoto langsung dari browser. | Kandidat |

Aturan: hanya Shortlink yang dipastikan tampil. Untuk kandidat lain, **tanyakan user** project mana yang ingin dipamerkan dan link publiknya — **jangan mengarang URL**. Tanpa konfirmasi, rilis dengan kartu yang sudah pasti/terverifikasi (cek link dengan `curl -I`) dan catat sisanya di *Butuh Tindakan User* **tanpa menunggu jawabannya**.

---

## 7. Daftar Tugas — Deliverable B

> Semua verifikasi B dijalankan di **GitHub Actions** (runner membangun dan menyajikan situs untuk diuji) dan di **URL Vercel**, bukan di mesin agent.

**B1 Audit repo Zanara** · Butuh: A14
- Ambil kode `khezan10/zanara-project` ke folder kerja (hanya untuk dibaca dan diubah). Catat: stack (HTML statis/Vite/Next/dll.), berkas masuk, cara Three.js dipasang, logika loading, perintah build, framework CSS, pengaturan project di Vercel (framework, build command, output dir).
- Cek apakah URL *Preview* Vercel project ini diproteksi (401) atau publik — tentukan apakah bisa dijadikan sasaran uji.
- Buat branch `feat/projects-section`. Catat temuan struktur di `progress.md` **sebelum** mengubah apa pun.
- **Selesai jika:** peta struktur, cara build, dan rencana perubahan singkat tercatat.

**B2 Hero tepat 1 layar** · Butuh: B1
- Terapkan 6.1 tanpa merusak loading dan scene Three.js.
- **Selesai jika:** perubahan di-push ke branch; build (CI/Vercel) tidak error. Pembuktian tinggi hero = tinggi viewport dilakukan di B7.

**B3 Data project & konfirmasi** · Butuh: B1, A14
- Buat berkas data 6.4. Hitung kata tiap penjelasan (5–10). Verifikasi tiap link (`curl -I`). Kandidat lain: catat permintaan konfirmasi di *Butuh Tindakan User* (lihat aturan 6.4).
- **Selesai jika:** minimal kartu Shortlink ada; semua link yang tampil terverifikasi.

**B4 Section & kartu** · Butuh: B2, B3
- Bangun section dan kartu sesuai 6.2 (responsif, kontras teks cukup, fokus keyboard terlihat pada link).
- **Selesai jika:** di-push ke branch; build tidak error.

**B5 Animasi mengetik** · Butuh: B4
- Terapkan 6.3 lengkap (observer sekali jalan, kursor, urutan antar-kartu, pewarnaan sintaks, reduced-motion).
- **Selesai jika:** di-push ke branch; build tidak error.

**B6 Polish: responsif, aksesibilitas, performa** · Butuh: B5
- Hentikan loop render Three.js saat hero tidak terlihat (observer) agar hemat baterai/GPU; lanjutkan saat terlihat lagi — jangan merusak loading awal.
- Pastikan `alt`/label, urutan tab, tidak ada layout shift saat mengetik.
- **Selesai jika:** di-push ke branch; build tidak error.

**B7 Uji UI otomatis di GitHub Actions** · Butuh: B6
- Tambahkan workflow (mis. `.github/workflows/ui-test.yml`) dan spec Playwright: runner `npm ci` → build → sajikan hasil build (mis. `npm run preview`/`npx serve`) → jalankan Playwright (Chromium). Workflow juga bisa dipicu manual dengan input `base_url` agar dapat diarahkan ke URL produksi.
- Untuk viewport 360×640, 390×844, 768×1024, 1440×900, 1920×1080, uji: (1) tinggi hero = tinggi viewport (±1 px), (2) pada `scrollY=0` section project berada **di luar** layar, (3) tinggi dokumen > tinggi viewport, (4) setelah scroll ke section, teks selesai diketik ≤ 6 detik dan tidak mengulang, (5) tiap kartu punya tepat nama + link + penjelasan (5–10 kata), (6) tidak ada error console, (7) tanpa scroll horizontal.
- Unggah screenshot sebagai artifact workflow (opsional).
- **Selesai jika:** workflow hijau pada PR; hasil tiap poin tercatat.

**B8 Deploy B** · Butuh: B7
- Buka PR dari `feat/projects-section` → pastikan CI hijau (dan URL Preview Vercel, bila publik, dicek dengan `curl`) → merge ke `main` (`gh pr merge`) bila tidak ada proteksi; jika tak bisa merge → `BLOCKED` untuk user.
- Setelah deployment produksi `READY`: verifikasi `https://zanara-project.vercel.app` dengan `curl` (kartu Shortlink ada di HTML) dan jalankan workflow uji UI terhadap URL produksi (`gh workflow run ui-test.yml -f base_url=https://zanara-project.vercel.app`).
- Produksi rusak → `git revert` + push, atau `npx vercel rollback`; catat di `progress.md`.
- **Selesai jika:** produksi menampilkan hero 1 layar + kartu dengan animasi; uji UI hijau terhadap produksi; kartu Shortlink mengarah ke `https://mzg.my.id`.

---

## 8. Penutup

**Z1 Laporan akhir** · Butuh: A17, B8
- Perbarui `progress.md`: tabel status final, **URL final** (repo, `mzg.my.id`, `zanara-project.vercel.app`), daftar keputusan, batasan paket gratis yang ditemukan (cron, durasi fungsi, batas M0), dan saran lanjutan (mis. Turnstile, statistik klik).
- Daftar ringkas *Butuh Tindakan User* yang tersisa (mis. rotasi password Atlas, konfirmasi project kartu).
- **Selesai jika:** user bisa membaca `progress.md` saja dan tahu apa yang sudah jadi, apa yang tersisa.

---

## 9. Lampiran

### 9.1 `.env.example`
```
MONGODB_URI=
MONGODB_DB=shortlink
NEXT_PUBLIC_BASE_URL=https://mzg.my.id
CRON_SECRET=
IP_HASH_SALT=
DEAD_LINK_STRIKES=2
MIN_RECHECK_HOURS=6
CREATE_LIMIT_PER_HOUR=10
```

### 9.2 `vercel.json`
```json
{
  "crons": [{ "path": "/api/cron/check-links", "schedule": "0 3 * * *" }]
}
```

### 9.3 `.github/workflows/ci.yml` (kerangka)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
```
*(Gunakan versi major terbaru yang stabil untuk tiap action.)*

### 9.4 `.github/workflows/e2e.yml` (kerangka)
```yaml
name: E2E
on:
  workflow_dispatch:
    inputs:
      base_url:
        description: "URL target, mis. https://mzg.my.id"
        required: true
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsx scripts/e2e.ts --base "$BASE_URL"
        env:
          BASE_URL: ${{ inputs.base_url }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          MONGODB_DB: ${{ vars.MONGODB_DB || 'shortlink' }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          DEAD_LINK_STRIKES: ${{ vars.DEAD_LINK_STRIKES || '2' }}
          CREATE_LIMIT_PER_HOUR: ${{ vars.CREATE_LIMIT_PER_HOUR || '10' }}
```

### 9.5 URL uji
- Hidup: `https://example.com`
- Mati (DNS tidak ada, pasti gagal): `https://domain-tidak-ada-123.invalid`
- Ditolak SSRF: `http://127.0.0.1`, `http://169.254.169.254`, `http://[::1]`, `http://localhost:3000`
