# Sambungkan SIM Diklat ke Moodle (masuk otomatis)

Hasil akhir: Login SIM Diklat → halaman **Pilih** → klik **Moodle** → langsung masuk Moodle,
tanpa mengetik email/kata sandi lagi.

Paket ini berisi dua folder:
- `moodle/`      → untuk Moodle Anda (plugin + skrip pengatur otomatis)
- `sim-diklat/`  → untuk project SIM Diklat (halaman pilihan + penyambung)

## A. Di Moodle (sekali saja)
1. Jalankan **Start Moodle.exe** (Apache & database harus hidup).
2. Salin **isi** folder `moodle/` dari paket ini ke `D:\moodle\` (gabungkan/Merge).
   Hasilnya: `D:\moodle\pasang-sso.bat`, `D:\moodle\server\moodle\auth\userkey\...`
3. Klik dua kali **`D:\moodle\pasang-sso.bat`**. Di akhir akan tercetak:

       MOODLE_URL="http://localhost"
       MOODLE_WS_TOKEN="xxxxxxxxxxxxxxxx"

   Salin kedua baris itu. (Skrip aman dijalankan ulang; token yang sama dicetak lagi.)

## B. Di SIM Diklat
1. Salin isi folder `sim-diklat/` ke atas project Anda (timpa file yang sama).
2. Tempel dua baris tadi ke file `.env` project.
3. Restart: `npm run dev`.

## C. Coba
Buka http://localhost:3000 → login → di halaman "Mau masuk ke mana?" klik **Moodle**.

## Cara kerjanya
- Akun dicocokkan lewat **email**. Jika email itu belum punya akun di Moodle, akun dibuat otomatis
  (username = email, nama dari SIM Diklat). Akun Moodle yang sudah ada tidak diubah.
- Link login dibuat di server SIM Diklat, berlaku 60 detik, dan **hanya bisa dipakai sekali**.
  Token tidak pernah sampai ke browser.

## Hal yang perlu Anda tahu
- **Email admin berbeda.** Akun Moodle `riko` memakai email Gmail Anda, sedangkan admin SIM Diklat
  `admin@diklat.go.id`. Maka klik Moodle sebagai admin SIM membuat akun Moodle *biasa* baru.
  Kalau ingin admin SIM = admin Moodle, ubah email akun `riko` di Moodle menjadi `admin@diklat.go.id`.
- **Peserta baru belum terdaftar di kursus.** Akun otomatis hanya masuk ke Moodle; mendaftarkannya
  ke kursus (mis. CODING-2026) masih manual lewat Moodle.
- **Token = kunci sakti.** Pemegang token bisa masuk ke akun Moodle mana pun. Jangan commit `.env`.
  Untuk membatasi hanya dari komputer SIM Diklat, jalankan di Moodle:
  `server\php\php.exe server\moodle\admin\cli\sim_diklat_sso.php --ip=127.0.0.1`

## Kalau gagal
Halaman Pilih menampilkan pesan merah; penyebab pastinya ada di terminal `npm run dev`
(baris `[moodle] auto-login gagal: ...`).
- `invalidtoken`    : token di `.env` salah → jalankan lagi `pasang-sso.bat` dan salin ulang.
- `accessexception` : token dibatasi IP lain (lihat opsi `--ip`).
- `fetch failed`    : Moodle belum jalan / `MOODLE_URL` salah.
