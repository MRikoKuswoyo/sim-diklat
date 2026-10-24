import { randomInt } from "crypto";

// Absen mandiri dibuka 15 menit sebelum sesi mulai sampai 30 menit setelah sesi selesai.
export const SEBELUM_MENIT = 15;
export const SESUDAH_MENIT = 30;
const ZONA = process.env.ZONA_WAKTU || "+07:00"; // zona waktu jadwal sesi (WIB)
const HURUF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa karakter yang mirip (O/0, I/1)

export const buatKode = () => Array.from({ length: 6 }, () => HURUF[randomInt(HURUF.length)]).join("");

/** Jendela waktu absen untuk satu sesi: { buka, tutup } (Date). */
export function jendelaAbsen(sesi) {
  const ymd = new Date(sesi.tanggal).toISOString().slice(0, 10);
  const mulai = new Date(`${ymd}T${sesi.jamMulai}:00${ZONA}`);
  const selesai = new Date(`${ymd}T${sesi.jamSelesai}:00${ZONA}`);
  return { buka: new Date(mulai.getTime() - SEBELUM_MENIT * 60000), tutup: new Date(selesai.getTime() + SESUDAH_MENIT * 60000) };
}

/** "BELUM_BUKA" | "BUKA" | "LEWAT" */
export function statusAbsen(sesi, sekarang = new Date()) {
  const { buka, tutup } = jendelaAbsen(sesi);
  return sekarang < buka ? "BELUM_BUKA" : sekarang > tutup ? "LEWAT" : "BUKA";
}

export const jamLokal = (d) => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).replace(".", ":");
