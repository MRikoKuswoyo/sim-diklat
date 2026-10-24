// Penjelasan waktu kelas ("Mulai 3 hari lagi", "Hari ke-4 dari 32") dan persentase progres. Berbasis hari kalender.
const H = 86400000;
const nomorHari = (d) => {
  const [y, m, t] = (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, t) / H;
};
const hariIni = (sekarang) => {
  const [y, m, t] = sekarang.toLocaleDateString("sv-SE").split("-").map(Number);
  return Date.UTC(y, m - 1, t) / H;
};

export function keteranganWaktu(mulai, selesai, sekarang = new Date()) {
  const m = nomorHari(mulai), s = nomorHari(selesai), n = hariIni(sekarang);
  if (n < m) { const d = m - n; return d === 1 ? "Mulai besok" : `Mulai ${d} hari lagi`; }
  if (n > s) { const d = n - s; return d === 1 ? "Selesai kemarin" : `Selesai ${d} hari lalu`; }
  return `Hari ke-${n - m + 1} dari ${s - m + 1}`;
}

export function progresWaktu(mulai, selesai, sekarang = new Date()) {
  const m = nomorHari(mulai), s = nomorHari(selesai), n = hariIni(sekarang);
  if (n < m) return 0;
  if (n > s) return 100;
  return Math.round(((n - m + 1) / (s - m + 1)) * 100);
}

export const fase = (mulai, selesai, sekarang = new Date()) => {
  const m = nomorHari(mulai), s = nomorHari(selesai), n = hariIni(sekarang);
  return n < m ? "AKAN" : n > s ? "SELESAI" : "BERJALAN";
};
