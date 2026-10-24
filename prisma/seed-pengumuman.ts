import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contoh pengumuman. Yang paling BARU (terakhir dibuat) tampil di kartu LIVE UPDATES portal peserta.
const contoh = [
  {
    judul: "Selamat datang di SIM Diklat",
    isi: "Portal ini dipakai untuk melihat jadwal kelas, materi, dan sertifikat. Untuk belajar online, klik Moodle di halaman pilihan setelah login.",
  },
  {
    judul: "Tugas Project Management dikumpulkan besok",
    isi: "Batas pengumpulan tugas Project Management adalah besok pukul 23.59 WIB. Kumpulkan lewat Moodle pada kursus yang bersangkutan.",
  },
  {
    judul: "Jadwal kelas Batch 2 dimulai Senin depan",
    isi: "Kelas Batch 2 dimulai Senin pukul 08.00 WIB. Harap hadir 15 menit sebelumnya dan cek materi di menu Materi & Silabus.",
  },
];

async function main() {
  // createdAt diberi jarak 1 menit agar urutannya jelas: item terakhir = paling baru
  const dasar = Date.now() - contoh.length * 60_000;
  for (let i = 0; i < contoh.length; i++) {
    const ada = await prisma.pengumuman.findFirst({ where: { judul: contoh[i].judul } });
    if (!ada) await prisma.pengumuman.create({ data: { ...contoh[i], createdAt: new Date(dasar + i * 60_000) } });
  }
  console.log("Contoh pengumuman siap:", await prisma.pengumuman.count(), "pengumuman di database.");
}

main().finally(() => prisma.$disconnect());
