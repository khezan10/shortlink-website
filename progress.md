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
| — | — | — | — | — |

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
| Repo shortlink | — | — |
| Deploy Vercel (`*.vercel.app`) | — | — |
| Domain produksi | — | — |
| Landing Zanara | — | — |

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

_(belum ada entri)_
