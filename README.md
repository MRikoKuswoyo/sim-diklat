# SIM Diklat — Project Skeleton

Fondasi project Next.js (App Router) + Tailwind CSS + Prisma untuk
Sistem Informasi Manajemen Diklat.

## Status langkah ini

✅ Struktur project & konfigurasi (Tailwind, Prisma, alias `@/`)
✅ Halaman: `/login`, `/dashboard`, `/kelas/[id]`, `/portal` (stub)
✅ Session auth server-side: JWT di httpOnly cookie (`src/lib/auth.js`),
   `middleware.js` melindungi rute admin & portal sesuai role
✅ API routes CRUD penuh untuk 6 entitas: `/api/diklat`, `/api/materi`,
   `/api/kelas` (+ shaped detail & sub-route pendaftaran peserta),
   `/api/peserta`, `/api/narasumber`, `/api/panitia`
✅ Halaman login sudah memanggil `/api/auth/login` sungguhan (bukan simulasi lagi)
✅ Halaman `/kelas` (list, server component, langsung query Prisma) dengan
   tombol "+ Kelas Baru"
✅ `/kelas/baru` — Form Wizard 4 langkah: pilih Judul Diklat → jadwal &
   lokasi → narasumber per materi & panitia → kuota + review → simpan
   (memanggil `/api/kelas`, lalu `/api/kelas/[id]/narasumber` dan
   `/api/kelas/[id]/panitia` untuk tiap penugasan)
✅ Sidebar navigasi persisten (`src/components/Sidebar.jsx`), menu
   menyesuaikan role (Admin lihat 7 menu, User lihat Portal saja),
   dibungkus lewat route group `src/app/(app)/layout.jsx`
✅ Halaman detail Kelas Diklat sekarang mengambil data Prisma asli
   (bukan data contoh lagi)
✅ Halaman list read-only untuk Judul Diklat, Materi, Peserta,
   Narasumber, Panitia — masing-masing query Prisma langsung
✅ Form Tambah/Edit/Hapus (modal) di kelima halaman list di atas —
   `src/components/crud/*Manager.jsx`, langsung panggil API yang sudah ada
✅ Portal Peserta lengkap (`/portal`): jadwal kelas yang diikuti, daftar
   materi per kelas dengan link "Unduh Silabus", dan "Unduh Sertifikat"
   untuk kelas yang statusnya Lulus (endpoint PATCH peserta-kelas sekarang
   juga menerima `sertifikatUrl`)
✅ Tab Peserta di Detail Kelas sekarang fungsional penuh: Export beneran
   generate file `.xlsx` (pakai `xlsx`/SheetJS), Import baca file
   .xlsx/.csv dan otomatis daftarkan tiap baris ke kelas, tombol Edit
   buka modal ubah nilai/status kelulusan/link sertifikat, tombol
   Keluarkan untuk unenroll, dan "+ Tambah Peserta" (peserta baru atau
   cari dari data yang sudah ada)
✅ Dashboard dengan data asli: 4 angka statistik (Diklat Aktif, Total
   Peserta, Kelas Berjalan, Persentase Kelulusan) dari query Prisma
   langsung, plus progress bar kelulusan keseluruhan dan daftar 5
   Kelas Terbaru
✅ **Sertifikat digital**: `/api/sertifikat/[pendaftaranId]` generate PDF
   sertifikat on-the-fly (pakai `pdf-lib`, tanpa storage eksternal) —
   desain krem/off-white dengan bingkai garis ganda emas, ornamen sudut
   geometris, judul serif formal (Times-Bold), nama penerima serif
   elegan (Times-Italic, padanan terdekat untuk kesan "script" karena
   pdf-lib tidak menyediakan font Cinzel/Great Vibes tanpa embed manual
   — lihat komentar di `src/lib/certificate.js` kalau mau pasang font
   custom itu). **Nomor sertifikat diisi manual oleh admin** (bukan
   digenerate otomatis) lewat field "Nomor Sertifikat" di modal Edit —
   tombol unduh baru muncul setelah nomor ini diisi. Admin juga masih
   bisa override total dengan "Link Sertifikat Kustom" kalau perlu file
   yang ditandatangani manual di luar sistem

Semua item dari roadmap awal sudah selesai dikerjakan. Pengembangan
lanjutan (opsional) yang bisa dikerjakan kalau dibutuhkan: embed font
custom (Cinzel/Great Vibes/Montserrat) di sertifikat, notifikasi email,
laporan/rekap per periode, halaman edit Kelas Diklat (sekarang baru
bisa lewat Prisma Studio atau API langsung), dan role tambahan
(Narasumber/Panitia login sendiri).

**Penting:**
1. `package.json` dapat 2 dependency baru (`xlsx`, `pdf-lib`) —
   jalankan `npm install` lagi sebelum `npm run dev`.
2. Skema database berubah (kolom baru `nomor_sertifikat`) — jalankan
   `npx prisma migrate dev --name tambah_nomor_sertifikat` supaya
   tabel di database Laragon ikut ter-update, sebelum `npm run dev`.

## Ringkasan endpoint API

| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login, set cookie session |
| POST | `/api/auth/logout` | Hapus cookie session |
| GET | `/api/auth/me` | Info user yang sedang login |
| GET/POST | `/api/diklat` | List / buat Judul Diklat |
| GET/PUT/DELETE | `/api/diklat/[id]` | Detail / ubah / hapus |
| GET/POST | `/api/materi` | List (filter `?judulDiklatId=`) / buat Materi |
| GET/PUT/DELETE | `/api/materi/[id]` | Detail / ubah / hapus |
| GET/POST | `/api/kelas` | List / buat Kelas Diklat |
| GET/PUT/DELETE | `/api/kelas/[id]` | Detail (shaped utk komponen) / ubah / hapus |
| POST | `/api/kelas/[id]/peserta` | Daftarkan peserta ke kelas |
| PATCH/DELETE | `/api/kelas/[id]/peserta/[pesertaId]` | Update nilai & status / keluarkan |
| POST | `/api/kelas/[id]/narasumber` | Plot narasumber ke materi tertentu (dipakai Wizard) |
| POST | `/api/kelas/[id]/panitia` | Tetapkan panitia + peran/PJ (dipakai Wizard) |
| GET/POST | `/api/peserta` | List (filter `?q=`) / buat Peserta |
| GET/PUT/DELETE | `/api/peserta/[id]` | Detail / ubah / hapus |
| GET/POST | `/api/narasumber` | List / buat Narasumber |
| GET/PUT/DELETE | `/api/narasumber/[id]` | Detail / ubah / hapus |
| GET/POST | `/api/panitia` | List / buat Panitia |
| GET/PUT/DELETE | `/api/panitia/[id]` | Detail / ubah / hapus |

Semua endpoint tulis (POST/PUT/PATCH/DELETE) memerlukan sesi role `ADMIN`.

## Menjalankan di lokal (Laragon / MySQL)

```bash
npm install
cp .env.example .env      # sudah default ke Laragon MySQL, tinggal sesuaikan kalau beda
npx prisma migrate dev --name init
npm run db:seed           # buat 2 akun demo (lihat kredensial di bawah)
npm run dev
```

Pastikan MySQL di Laragon sudah "Start All" dan database `sim_diklat` sudah
dibuat lewat HeidiSQL sebelum menjalankan `prisma migrate dev`.

> Pakai PostgreSQL, bukan Laragon? Ganti `provider = "mysql"` menjadi
> `"postgresql"` di `prisma/schema.prisma`, lalu sesuaikan `DATABASE_URL`
> di `.env` (contoh format ada di komentar `.env.example`).

Buka `http://localhost:3000` → diarahkan ke `/login`.

## Kredensial demo

| Role  | Email                         | Password     |
|-------|--------------------------------|--------------|
| Admin | admin@diklat.go.id             | Admin123!    |
| User  | andi.saputra@pemko.go.id       | Peserta123!  |

## Struktur folder

```
prisma/
  schema.prisma   → 6 entitas inti + relasi (lihat ARSITEKTUR-DIKLAT.md)
  seed.ts         → seed 2 akun demo
src/
  app/
    login/        → halaman login (client component)
    dashboard/    → dashboard admin (placeholder statistik)
    kelas/[id]/   → detail kelas (tabbed: Overview/Materi/Peserta/Panitia)
  components/
    KelasDiklatDetail.jsx
  lib/
    prisma.js     → singleton PrismaClient
```

## Dokumen pendukung

- `ARSITEKTUR-DIKLAT.md` — ERD, arsitektur navigasi, user flow, sistem desain
- `prototype-demo.html` — prototype interaktif 1-file (buka langsung di
  browser, tanpa perlu `npm install`) untuk lihat alur login → dashboard
  → detail kelas → portal peserta dengan data contoh
