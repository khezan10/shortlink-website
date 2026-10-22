# progress.md — Pelacak Kerja Agent

> **Cara pakai:** baca file ini dulu, ambil tugas `TODO` berikutnya (urut ID, dependensi sudah `DONE`), kerjakan sesuai `plan.md`, lalu **perbarui file ini sebelum pindah tugas**.
> **Jangan pernah menulis secret** (URI/password/token) di sini — repo ini public.
> Status: `TODO` · `DOING` · `DONE` · `BLOCKED` · `SKIPPED` (wajib beri alasan)

**Mode kerja:** CLOUD-ONLY — GitHub (kode + Actions), Vercel (build + hosting), Atlas (data). Tanpa server/DB lokal.
**Terakhir diperbarui:** —
**Tugas aktif:** —

---

## 1. Tabel Status

### Persiapan
| ID | Tugas | Status | Diperbarui | Catatan singkat |
|----|-------|--------|------------|-----------------|
| P0.1 | Cek tools & login | TODO | — | |
| P0.2 | Cek berkas kredensial Atlas | TODO | — | |
| P0.3 | Cek Cloudflare & DNS | TODO | — | |

### Deliverable A — Shortlink Website
| ID | Tugas | Status | Diperbarui | Catatan singkat |
|----|-------|--------|------------|-----------------|
| A1 | Scaffold berkas proyek (tanpa menjalankan lokal) | TODO | — | |
| A2 | Repo GitHub public + project Vercel + environment + deploy awal | TODO | — | |
| A3 | Hardening Atlas | TODO | — | |
| A4 | Koneksi MongoDB & index otomatis | TODO | — | |
| A5 | Validasi URL & guard SSRF | TODO | — | |
| A6 | Checker URL | TODO | — | |
| A7 | Generator kode & alias | TODO | — | |
| A8 | `POST /api/links` + rate limit | TODO | — | |
| A9 | Redirect `/[code]` + lazy check | TODO | — | |
| A10 | Cron pembersih link mati | TODO | — | |
| A11 | UI beranda, 404, metadata | TODO | — | |
| A12 | Siapkan uji otomatis di GitHub Actions | TODO | — | |
| A13 | Rilis produksi pertama & verifikasi di Vercel | TODO | — | |
| A14 | Domain `mzg.my.id` | TODO | — | |
| A15 | README, LICENSE, metadata repo | TODO | — | |
| A16 | Uji E2E pada domain produksi | TODO | — | |
| A17 | Audit keamanan final & rilis | TODO | — | |

### Deliverable B — Landing Zanara
| ID | Tugas | Status | Diperbarui | Catatan singkat |
|----|-------|--------|------------|-----------------|
| B1 | Audit repo Zanara | TODO | — | |
| B2 | Hero tepat 1 layar | TODO | — | |
| B3 | Data project & konfirmasi | TODO | — | |
| B4 | Section & kartu | TODO | — | |
| B5 | Animasi mengetik | TODO | — | |
| B6 | Polish: responsif, a11y, performa | TODO | — | |
| B7 | Uji UI otomatis di GitHub Actions | TODO | — | |
| B8 | Deploy B | TODO | — | |

### Penutup
| ID | Tugas | Status | Diperbarui | Catatan singkat |
|----|-------|--------|------------|-----------------|
| Z1 | Laporan akhir | TODO | — | |

---

## 2. Butuh Tindakan User

> Isi saat ada `BLOCKED`. Tulis: **apa**, **di mana**, **langkah persis**, **tugas yang menunggu**.

| # | Tugas terblokir | Yang dibutuhkan | Langkah untuk user | Selesai? |
|---|-----------------|-----------------|--------------------|----------|
| 1 | A3/A8/A16 | Akses jaringan Atlas dari Vercel | Buka cloud.mongodb.com → pilih project → **Network Access** → **Add IP Address** → pilih **Allow Access from Anywhere** (`0.0.0.0/0`) → **Confirm**. Tunggu 1–2 menit, lalu buka https://shortlink-website-psi.vercel.app/api/health | Ya (2026-10-20) |

---

## 3. Keputusan

> Keputusan baru di luar D1–D9 pada `plan.md`.

| Tanggal | Keputusan | Alasan |
|---------|-----------|--------|
| — | — | — |

---

## 4. Perubahan Plan

> Catat jika `plan.md` terpaksa diubah (apa, mengapa).

- —

---

## 5. Temuan Penting

> Hal yang perlu diingat: batas paket gratis (cron, durasi fungsi, kuota M0), perilaku tak terduga, versi tool, struktur repo Zanara, dll.

- —

---

## 6. URL Final

| Item | URL | Terverifikasi |
|------|-----|---------------|
| Repo shortlink | https://github.com/khezan10/shortlink-website | ya |
| Deploy Vercel (`*.vercel.app`) | https://shortlink-website-psi.vercel.app | ya (HTTP 200) |
| Domain produksi | — (belum ada domain kustom) | — |
| Landing Zanara | https://zanara-project.vercel.app | ya |

---

## 7. Log Kerja

> Entri terbaru di **atas**. Format:
> ```
> ### [ID] Judul tugas — STATUS — YYYY-MM-DD HH:MM
> **Dikerjakan:** ...
> **Temuan:** ...
> **Bukti:** perintah + ringkasan output (tanpa secret)
> **Keputusan:** ...
> **Next:** ...
> ```

### [E3] Shortlink fungsional + restyle daftar link — DONE — 2026-10-20 16:55
**Dikerjakan:** mengganti `MONGODB_URI` Vercel dengan kredensial Atlas yang valid, menambah CSS daftar "link terbaru" yang sebelumnya belum ada, dan mengatur jarak hero → daftar.
**Temuan:** setelah allowlist aktif error berubah `ECONNREFUSED` → `AUTH_FAILED`, artinya jaringan sudah tembus tetapi password di env Vercel masih yang lama; kartu link juga tampil tanpa border/padding karena kelas `.links-list`/`.link-card` belum didefinisikan.
**Bukti:** `/api/health` → 200 `{"ok":true}`; `POST /api/links` → 201 `5hHBzdE`; POST ulang → 409 `DUPLICATE_URL` + shortUrl lama; `GET /api/links` → 2 entri; CSS produksi memuat `.links-list`, `.link-card`, `.link-clicks`, `.list-empty`.
**Keputusan:** kartu dua baris (shortlink + badge klik, lalu URL asli terpotong elipsis) agar domain panjang tidak memenggal kata; jarak hero→daftar 64px desktop / 48px mobile dengan garis pemisah.
**Next:** E4 (uji checker link mati) dan E5/E7 (SECURITY.md, dependabot, ui-test).

### [E3] Shortlink fungsional — DOING — 2026-10-20 15:05
**Dikerjakan:** audit koneksi DB produksi, perbaikan env Vercel, penambahan GET /api/links, daftar link di bawah hero, dan penolakan duplikat URL.
**Temuan:** MONGODB_URI di Vercel rusak (1224 char) dan NEXT_PUBLIC_BASE_URL menunjuk domain 404; Atlas menolak koneksi dari Vercel (ECONNREFUSED).
**Bukti:** `/api/health` → 500 `MongoServerSelectionError`; koneksi URI yang sama dari mesin lokal → `CONNECT_OK`; insert duplikat di Atlas → `11000` pada field `url`; halaman produksi memuat "link terbaru".
**Keputusan:** env Vercel diperbaiki; daftar link + dedupe diimplementasikan.
**Next:** menunggu allowlist Atlas dari user, lalu uji e2e penuh.

---

## 8. Evaluasi

**Terakhir diperbarui:** 2026-10-20 15:05
**Skor checklist:** 2/9 lulus · 5 sebagian · 2 terblokir

### 8.1 Tabel Temuan

| ID | Tingkat | Area | Temuan | Bukti (ringkas) | Status | Commit |
|----|---------|------|--------|-----------------|--------|--------|
| F-01 | P0 | E3/E9 | `MONGODB_URI` di Vercel berisi nilai rusak (1224 char) sehingga health 500 | `/api/health` → `{ok:false}`, nilai env 1224 char | FIXED | env Vercel (tanpa commit) |
| F-02 | P0 | E3 | `NEXT_PUBLIC_BASE_URL` menunjuk `shortlink-website.vercel.app` (404), shortUrl akan mati | curl domain → 404; domain asli `shortlink-website-psi.vercel.app` → 200 | FIXED | env Vercel |
| F-03 | P1 | E3/E6 | `GET /api/links` belum ada; daftar link tidak pernah tampil | `find app -type f` tidak menemukan handler GET daftar | FIXED | 3c62584 |
| F-04 | P1 | E3 | URL tujuan yang sama bisa dibuat berulang dengan kode berbeda | tidak ada index unik `url`; `findOne({url})` tidak ada | FIXED | 3c62584 |
| F-05 | P0 | E3/E9 | Atlas menolak koneksi dari Vercel (Network Access) + `MONGODB_URI` memakai password lama | health `ECONNREFUSED`, lalu `AUTH_FAILED` setelah allowlist | FIXED | env Vercel + 9809a66 |
| F-06 | P2 | E2 | Health 500 tanpa alasan yang bisa didiagnosis | respons lama hanya `{ok:false}` | FIXED | ac9e659 |
| F-07 | P2 | E9 | `mzg.my.id` sudah dipakai Zanara; shortlink belum punya domain kustom | curl `https://mzg.my.id` → title "Zanara Project" | BLOCKED | — |
| F-08 | P1 | E5/E6/E7 | `SECURITY.md`, `dependabot.yml`, `ui-test.yml`/Lighthouse belum ada | `ls` → tidak ditemukan | TODO | — |

### 8.2 Tabel Checklist

| E | Cakupan | Status | Catatan |
|---|---------|--------|---------|
| E1 | Kepatuhan proses | Sebagian | CI hijau di `main` (ac9e659), commit Conventional; `progress.md` baru dilengkapi |
| E2 | Keamanan & secret | Sebagian | Password/URI tidak ada di seluruh riwayat git; `.env.example` placeholder; cron 401 sudah diuji; e2e SSRF belum bisa jalan tanpa DB |
| E3 | Fungsional shortlink | Lulus | health `ok:true`; POST 201, duplikat 409 `DUPLICATE_URL`, GET menampilkan 2 link |
| E4 | Aturan link mati | Terblokir | Kode checker sesuai plan; e2e belum bisa dijalankan |
| E5 | Kualitas kode & tes | Sebagian | CI hijau; `npm audit`/dependabot belum ditambahkan |
| E6 | UI/UX & a11y | Sebagian | Daftar link + state kosong sudah ada; Playwright/Lighthouse belum |
| E7 | README & repo | Sebagian | README ada; SECURITY.md belum |
| E8 | Landing Zanara | Lulus | `https://mzg.my.id` → 200, title "Zanara Project" |
| E9 | Operasional | Sebagian | Auto-deploy `main` aktif; DB, cron, domain kustom belum terverifikasi |

### 8.3 Penambahan yang Dilakukan

- `GET /api/links` (limit 1–200, urut terbaru) untuk daftar di bawah hero.
- Index unik `{url:1}` + fallback index biasa bila data lama berduplikat.
- `POST /api/links` menolak duplikat dengan `409 DUPLICATE_URL` + shortUrl yang sudah ada.
- Section "link terbaru" di bawah hero: shortlink, URL tujuan, jumlah klik, state kosong.
- `reason` terklasifikasi di `/api/health` (tanpa membocorkan pesan/secret).
- Perbaikan env Vercel: `MONGODB_URI` dan `NEXT_PUBLIC_BASE_URL`.

### 8.4 Putaran Evaluasi

- **Putaran 1 (2026-10-20):** E1–E9 diperiksa. F-01–F-04, F-06 diperbaiki dan di-deploy. F-05 (allowlist Atlas) memblokir E3/E4 sehingga e2e, Lighthouse, dan uji duplikat end-to-end belum bisa dijalankan.
- **Putaran 2:** menunggu F-05 selesai.
- **Putaran 3:** belum dijalankan.

### 8.5 Saran untuk User (P3)

- `mzg.my.id` saat ini dipakai Zanara. Untuk shortlink, pertimbangkan subdomain seperti `link.mzg.my.id` agar landing Zanara tidak terganggu.
