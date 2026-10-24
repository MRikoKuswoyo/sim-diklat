import { prisma } from "@/lib/prisma";

// Format: SERT/<KODE DIKLAT>/<TAHUN SELESAI KELAS>/<URUT 4 digit>; urut naik per kode+tahun.
// pd harus menyertakan kelas.judulDiklat.
export async function nomorBaru(pd) {
  const prefix = `SERT/${pd.kelas.judulDiklat.kode}/${new Date(pd.kelas.tanggalSelesai).getFullYear()}/`;
  const ada = await prisma.pendaftaranPeserta.findMany({ where: { nomorSertifikat: { startsWith: prefix } }, select: { nomorSertifikat: true } });
  const maks = Math.max(0, ...ada.map((a) => parseInt(a.nomorSertifikat.slice(prefix.length), 10) || 0));
  return prefix + String(maks + 1).padStart(4, "0");
}

// Beri nomor bila pendaftaran ini belum punya.
export async function isiNomorBilaKosong(pendaftaranId) {
  const pd = await prisma.pendaftaranPeserta.findUnique({
    where: { id: pendaftaranId },
    include: { kelas: { include: { judulDiklat: true } } },
  });
  if (!pd || pd.nomorSertifikat) return pd;
  return prisma.pendaftaranPeserta.update({ where: { id: pd.id }, data: { nomorSertifikat: await nomorBaru(pd) } });
}

// Beri nomor untuk semua peserta Lulus di kelas ini yang sudah punya sertifikat tapi belum bernomor
// (mis. sertifikat yang tautannya diisi sebelum fitur nomor ada). Dijalankan berurutan agar nomor tidak ganda.
export async function isiNomorKelas(kelasId) {
  const kosong = await prisma.pendaftaranPeserta.findMany({
    where: { kelasId, statusKelulusan: "LULUS", sertifikatUrl: { not: null }, nomorSertifikat: null },
    select: { id: true },
  });
  for (const k of kosong) await isiNomorBilaKosong(k.id);
}
