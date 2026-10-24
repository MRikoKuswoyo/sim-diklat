import { prisma } from "@/lib/prisma";

// ---------- Perhitungan murni (tanpa database) ----------

/** Nilai akhir berbobot (0-100). null bila ada komponen yang belum diisi atau belum ada komponen. */
export function hitungNilaiAkhir(komponen, nilaiMap) {
  if (!komponen.length) return null;
  const totalBobot = komponen.reduce((n, k) => n + k.bobot, 0);
  if (!totalBobot) return null;
  let jumlah = 0;
  for (const k of komponen) {
    const v = nilaiMap[k.id];
    if (v === undefined || v === null) return null;
    jumlah += v * k.bobot;
  }
  return Math.round((jumlah / totalBobot) * 100) / 100;
}

/** LULUS bila nilai & kehadiran memenuhi; PROSES bila nilai belum lengkap. Kehadiran diabaikan jika belum ada sesi berlangsung. */
export function sarankanStatus({ nilaiAkhir, kehadiran, nilaiMinimal, kehadiranMinimal }) {
  if (nilaiAkhir === null) return "PROSES";
  const okNilai = nilaiAkhir >= nilaiMinimal;
  const okHadir = kehadiran === null || kehadiran >= kehadiranMinimal;
  return okNilai && okHadir ? "LULUS" : "TIDAK_LULUS";
}

// ---------- Rekap dari database ----------

export async function muatRekap(kelasId) {
  const hariIni = new Date(new Date().toLocaleDateString("sv-SE")); // tanggal lokal, 00:00 UTC
  const [kelas, komponen, pend, nilaiRows, sesiLalu] = await Promise.all([
    prisma.kelasDiklat.findUnique({ where: { id: kelasId }, select: { nilaiMinimal: true, kehadiranMinimal: true } }),
    prisma.komponenNilai.findMany({ where: { kelasId }, orderBy: { createdAt: "asc" } }),
    prisma.pendaftaranPeserta.findMany({ where: { kelasId }, include: { peserta: { select: { id: true, nama: true } } } }),
    prisma.nilaiKomponen.findMany({ where: { komponen: { kelasId } } }),
    prisma.sesiKelas.findMany({ where: { kelasId, tanggal: { lte: hariIni } }, include: { presensi: true } }),
  ]);
  if (!kelas) return null;

  const peserta = pend
    .map((pd) => {
      const nilai = {};
      for (const r of nilaiRows) if (r.pesertaId === pd.pesertaId) nilai[r.komponenId] = r.nilai;
      const hadir = sesiLalu.filter((s) => s.presensi.some((p) => p.pesertaId === pd.pesertaId && p.status === "HADIR")).length;
      const kehadiran = sesiLalu.length ? Math.round((hadir / sesiLalu.length) * 100) : null;
      const nilaiAkhir = hitungNilaiAkhir(komponen, nilai);
      return {
        id: pd.pesertaId, nama: pd.peserta.nama, nilai, nilaiAkhir, kehadiran,
        saran: sarankanStatus({ nilaiAkhir, kehadiran, nilaiMinimal: kelas.nilaiMinimal, kehadiranMinimal: kelas.kehadiranMinimal }),
        statusSekarang: pd.statusKelulusan,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  return {
    aturan: { nilaiMinimal: kelas.nilaiMinimal, kehadiranMinimal: kelas.kehadiranMinimal },
    komponen: komponen.map((k) => ({ id: k.id, nama: k.nama, bobot: k.bobot })),
    totalBobot: komponen.reduce((n, k) => n + k.bobot, 0),
    adaSesi: sesiLalu.length > 0,
    peserta,
  };
}
