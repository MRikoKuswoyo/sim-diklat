import { syncStatusKelas } from "@/lib/kelasStatus";
import { keteranganWaktu, progresWaktu } from "@/lib/kelasWaktu";
import { prisma } from "@/lib/prisma";
import DaftarKelas from "@/components/DaftarKelas";

export const dynamic = "force-dynamic";

export default async function KelasListPage() {
  await syncStatusKelas();
  const kelas = await prisma.kelasDiklat.findMany({
    include: { judulDiklat: true, pendaftaran: { select: { statusKelulusan: true } }, _count: { select: { sesi: true } } },
    orderBy: { tanggalMulai: "desc" },
  });

  const data = kelas.map((k) => ({
    id: k.id, kode: k.judulDiklat.kode, nama: k.judulDiklat.nama, kategori: k.judulDiklat.kategori, batch: k.namaBatch,
    status: k.status, lokasi: k.lokasiAtauLink, mulai: k.tanggalMulai.toISOString(), selesai: k.tanggalSelesai.toISOString(),
    peserta: k.pendaftaran.length, kuota: k.kuota, lulus: k.pendaftaran.filter((p) => p.statusKelulusan === "LULUS").length, sesi: k._count.sesi,
    progres: progresWaktu(k.tanggalMulai, k.tanggalSelesai), keterangan: keteranganWaktu(k.tanggalMulai, k.tanggalSelesai),
  }));

  return <DaftarKelas kelas={data} />;
}
