import { prisma } from "@/lib/prisma";

// Samakan status kelas dengan tanggalnya (dipanggil saat dashboard/portal dibuka).
export async function syncStatusKelas() {
  const sekarang = new Date();
  const hariIni = new Date(sekarang); hariIni.setHours(0, 0, 0, 0);
  const besok = new Date(hariIni.getTime() + 86400000);
  await prisma.kelasDiklat.updateMany({
    where: { status: "PERSIAPAN", tanggalMulai: { lt: besok }, tanggalSelesai: { gte: hariIni } },
    data: { status: "BERJALAN" },
  });
  await prisma.kelasDiklat.updateMany({
    where: { status: { in: ["PERSIAPAN", "BERJALAN"] }, tanggalSelesai: { lt: hariIni } },
    data: { status: "SELESAI" },
  });
}
