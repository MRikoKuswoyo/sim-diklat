import { syncStatusKelas } from "@/lib/kelasStatus";
import { isiNomorKelas } from "@/lib/nomorSertifikat";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import KelasDiklatDetail from "@/components/KelasDiklatDetail";
import { keteranganWaktu, progresWaktu } from "@/lib/kelasWaktu";
import { moodleConfig } from "@/lib/moodle";

// Bentuk data ini sengaja disusun sama seperti response
// GET /api/kelas/[id] (lihat src/app/api/kelas/[id]/route.js), supaya
// komponen <KelasDiklatDetail /> yang sama bisa dipakai di server component
// ini maupun dipanggil lewat API oleh client lain di masa depan.
export default async function KelasDetailPage({ params }) {
  await syncStatusKelas();
  await isiNomorKelas(params.id);
  const kelas = await prisma.kelasDiklat.findUnique({
    where: { id: params.id },
    include: {
      judulDiklat: { include: { materi: true } },
      pendaftaran: { include: { peserta: true } },
      pengajarKelas: { include: { narasumber: true } },
      panitiaKelas: { include: { panitia: true } },
    },
  });
  if (!kelas) notFound();

  const materi = kelas.judulDiklat.materi.map((m) => ({
    id: m.id,
    judulMateri: m.judulMateri,
    durasiJp: m.durasiJp,
    narasumber: kelas.pengajarKelas
      .filter((pk) => pk.materiId === m.id)
      .map((pk) => ({ id: pk.narasumber.id, nama: pk.narasumber.nama, kepakaran: pk.narasumber.kepakaran })),
  }));

  const peserta = kelas.pendaftaran.map((pd) => ({
    id: pd.peserta.id,
    pendaftaranId: pd.id,
    nama: pd.peserta.nama,
    nipNik: pd.peserta.nipNik,
    instansi: pd.peserta.instansi,
    email: pd.peserta.email,
    nilai: pd.nilai,
    statusKelulusan: pd.statusKelulusan,
    sertifikatUrl: pd.sertifikatUrl,
    nomorSertifikat: pd.nomorSertifikat,
  }));

  const panitia = kelas.panitiaKelas.map((pk) => ({
    id: pk.panitia.id,
    nama: pk.panitia.nama,
    peranPj: pk.peranPj,
    kontak: pk.panitia.kontak,
  }));

  const shaped = {
    id: kelas.id,
    namaBatch: kelas.namaBatch,
    status: kelas.status,
    kuota: kelas.kuota,
    tanggalMulai: kelas.tanggalMulai,
    tanggalSelesai: kelas.tanggalSelesai,
    lokasiAtauLink: kelas.lokasiAtauLink,
    judulDiklat: {
      nama: kelas.judulDiklat.nama,
      kode: kelas.judulDiklat.kode,
      kategori: kelas.judulDiklat.kategori,
    },
    materi,
    peserta,
    panitia,
  };

  const hariIni = new Date(new Date().toLocaleDateString("sv-SE"));
  const [sesiTotal, sesiLalu, komponen] = await Promise.all([
    prisma.sesiKelas.count({ where: { kelasId: kelas.id } }),
    prisma.sesiKelas.count({ where: { kelasId: kelas.id, tanggal: { lte: hariIni } } }),
    prisma.komponenNilai.count({ where: { kelasId: kelas.id } }),
  ]);
  const ekstra = {
    sesiTotal, sesiLalu, komponen,
    moodleCourseId: kelas.moodleCourseId ?? null,
    moodleUrl: moodleConfig().url,
    waktu: { keterangan: keteranganWaktu(kelas.tanggalMulai, kelas.tanggalSelesai), progres: progresWaktu(kelas.tanggalMulai, kelas.tanggalSelesai) },
  };

  return (
    <div className="-m-6 sm:-m-8">
      <KelasDiklatDetail kelas={shaped} ekstra={ekstra} />
    </div>
  );
}
