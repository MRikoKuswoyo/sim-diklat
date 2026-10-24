import { prisma } from "@/lib/prisma";

/**
 * Cari sertifikat untuk diverifikasi publik. `kode` boleh berupa ID pendaftaran (dari QR) atau nomor sertifikat.
 * Sah bila peserta berstatus LULUS. Data yang dikembalikan sengaja minim (tanpa NIP/NIK, email, instansi).
 */
export async function cariSertifikat(kode) {
  const k = String(kode || "").trim();
  if (!k || k.length > 120) return null;
  const pd = await prisma.pendaftaranPeserta.findFirst({
    where: { statusKelulusan: "LULUS", OR: [{ id: k }, { nomorSertifikat: k }] },
    include: { peserta: { select: { nama: true } }, kelas: { include: { judulDiklat: { include: { materi: true } } } } },
  });
  if (!pd) return null;
  return {
    nama: pd.peserta.nama,
    nomor: pd.nomorSertifikat,
    diklat: pd.kelas.judulDiklat.nama,
    batch: pd.kelas.namaBatch,
    mulai: pd.kelas.tanggalMulai,
    selesai: pd.kelas.tanggalSelesai,
    totalJp: pd.kelas.judulDiklat.materi.reduce((n, m) => n + m.durasiJp, 0),
  };
}

// Segmen URL catch-all -> kode (nomor sertifikat mengandung "/")
export function kodeDariSegmen(segmen) {
  return (segmen || []).map((s) => { try { return decodeURIComponent(s); } catch { return s; } }).join("/");
}
