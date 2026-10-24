import { prisma } from "@/lib/prisma";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const kunciBulan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const persen = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ===================== Pengolahan murni (tanpa database, mudah diuji) =====================
export function agregasiDashboard({ diklatAktif, totalPeserta, pesertaTanpaAkun, kelasList, sesiHariIni, pengumuman, sekarang = new Date() }) {
  const semuaPd = kelasList.flatMap((k) => k.pendaftaran);
  const status = { LULUS: 0, PROSES: 0, TIDAK_LULUS: 0 };
  for (const p of semuaPd) status[p.statusKelulusan] += 1;

  // 12 bulan terakhir: pendaftaran (menurut tanggal daftar) dan kelas yang dimulai
  const perBulan = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(sekarang.getFullYear(), sekarang.getMonth() - (11 - i), 1);
    return { key: kunciBulan(d), label: BULAN[d.getMonth()], tahun: d.getFullYear(), pendaftaran: 0, kelas: 0 };
  });
  const idx = new Map(perBulan.map((b, i) => [b.key, i]));
  for (const p of semuaPd) { const i = idx.get(kunciBulan(new Date(p.tanggalDaftar))); if (i !== undefined) perBulan[i].pendaftaran += 1; }
  for (const k of kelasList) { const i = idx.get(kunciBulan(new Date(k.tanggalMulai))); if (i !== undefined) perBulan[i].kelas += 1; }

  // Hal-hal yang perlu ditindaklanjuti admin
  const perhatian = [];
  const tambah = (id, tingkat, judul, detail, daftar, hrefUmum) => {
    if (!daftar.length) return;
    perhatian.push({ id, tingkat, judul, detail, jumlah: daftar.length, href: daftar.length === 1 ? `/kelas/${daftar[0]}` : hrefUmum });
  };
  const lulusTanpaSertifikat = kelasList.filter((k) => k.pendaftaran.some((p) => p.statusKelulusan === "LULUS" && !p.sertifikatUrl));
  const jumlahTanpaSertif = kelasList.reduce((n, k) => n + k.pendaftaran.filter((p) => p.statusKelulusan === "LULUS" && !p.sertifikatUrl).length, 0);
  if (lulusTanpaSertifikat.length) perhatian.push({ id: "sertifikat", tingkat: "warn", judul: "Peserta lulus belum punya sertifikat", detail: `${jumlahTanpaSertif} peserta di ${lulusTanpaSertifikat.length} kelas`, jumlah: jumlahTanpaSertif, href: lulusTanpaSertifikat.length === 1 ? `/kelas/${lulusTanpaSertifikat[0].id}` : "/kelas" });
  const selesaiBelumDinilai = kelasList.filter((k) => k.status === "SELESAI" && k.pendaftaran.some((p) => p.statusKelulusan === "PROSES"));
  tambah("nilai", "warn", "Kelas selesai tetapi kelulusan belum ditentukan", "Masih ada peserta berstatus Proses", selesaiBelumDinilai.map((k) => k.id), "/kelas");
  tambah("sesi", "info", "Kelas belum punya jadwal sesi", "Tambahkan sesi agar presensi dan kalender peserta terisi", kelasList.filter((k) => ["PERSIAPAN", "BERJALAN"].includes(k.status) && k._count.sesi === 0).map((k) => k.id), "/kelas");
  tambah("komponen", "info", "Kelas belum punya komponen penilaian", "Atur bobot nilai agar kelulusan bisa dihitung otomatis", kelasList.filter((k) => ["BERJALAN", "SELESAI"].includes(k.status) && k._count.komponenNilai === 0).map((k) => k.id), "/kelas");
  if (pesertaTanpaAkun > 0) perhatian.push({ id: "akun", tingkat: "info", judul: "Peserta belum punya akun login", detail: "Mereka belum mendaftar lewat halaman Daftar akun", jumlah: pesertaTanpaAkun, href: "/peserta" });

  return {
    kpi: {
      diklatAktif, totalPeserta,
      kelasBerjalan: kelasList.filter((k) => k.status === "BERJALAN").length,
      persenLulus: persen(status.LULUS, semuaPd.length),
      sertifikat: semuaPd.filter((p) => p.sertifikatUrl).length,
      sesiHariIni: sesiHariIni.length,
    },
    status: { ...status, total: semuaPd.length },
    perBulan,
    perhatian,
    sesiHariIni: sesiHariIni.map((s) => ({
      id: s.id, judul: s.judul, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai, kelasId: s.kelasId,
      kelas: `${s.kelas.judulDiklat.nama} — ${s.kelas.namaBatch}`, absenDibuka: !!s.kodeAbsen,
      hadir: s.presensi.filter((p) => p.status === "HADIR").length, total: s.kelas._count.pendaftaran,
    })),
    kelas: kelasList.slice(0, 30).map((k) => {
      const mulai = new Date(k.tanggalMulai).getTime(), selesai = new Date(k.tanggalSelesai).getTime();
      return {
        id: k.id, kode: k.judulDiklat.kode, nama: k.judulDiklat.nama, batch: k.namaBatch, status: k.status,
        mulai: new Date(k.tanggalMulai).toISOString(), selesai: new Date(k.tanggalSelesai).toISOString(),
        peserta: k.pendaftaran.length, kuota: k.kuota, lulus: k.pendaftaran.filter((p) => p.statusKelulusan === "LULUS").length,
        progresWaktu: selesai > mulai ? Math.max(0, Math.min(100, Math.round(((sekarang.getTime() - mulai) / (selesai - mulai)) * 100))) : 0,
      };
    }),
    pengumuman: pengumuman ? { judul: pengumuman.judul, isi: pengumuman.isi, createdAt: new Date(pengumuman.createdAt).toISOString() } : null,
  };
}

// ===================== Pengambilan data =====================
export async function muatDashboard() {
  const hariIni = new Date(new Date().toLocaleDateString("sv-SE")); // tanggal lokal, 00:00 UTC (cocok dengan kolom Date)
  const [diklatAktif, totalPeserta, pesertaTanpaAkun, kelasList, sesiHariIni, pengumuman] = await Promise.all([
    prisma.judulDiklat.count({ where: { status: "AKTIF" } }),
    prisma.peserta.count(),
    prisma.peserta.count({ where: { user: { is: null } } }),
    prisma.kelasDiklat.findMany({
      include: {
        judulDiklat: true,
        pendaftaran: { select: { statusKelulusan: true, sertifikatUrl: true, tanggalDaftar: true } },
        _count: { select: { sesi: true, komponenNilai: true } },
      },
      orderBy: { tanggalMulai: "desc" },
    }),
    prisma.sesiKelas.findMany({
      where: { tanggal: hariIni },
      include: { presensi: true, kelas: { include: { judulDiklat: true, _count: { select: { pendaftaran: true } } } } },
      orderBy: { jamMulai: "asc" },
    }),
    prisma.pengumuman.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  return agregasiDashboard({ diklatAktif, totalPeserta, pesertaTanpaAkun, kelasList, sesiHariIni, pengumuman });
}
