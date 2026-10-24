import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { muatRekap } from "@/lib/kelulusan";

// ====================== Excel ======================

/** sheets: [[namaSheet, [ {kolom: nilai}, ... ]], ...] -> Buffer .xlsx (lebar kolom otomatis, teks tetap teks agar NIP/NIK tidak rusak) */
export function bukuExcel(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [nama, rows] of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const kolom = Object.keys(rows[0] || {});
    ws["!cols"] = kolom.map((k) => ({ wch: Math.min(50, Math.max(String(k).length, ...rows.map((r) => String(r[k] ?? "").length)) + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, nama.slice(0, 31));
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export const responExcel = (buffer, namaFile) =>
  new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile.replace(/[^A-Za-z0-9._-]+/g, "-")}"`,
      "Cache-Control": "private, no-store",
    },
  });

export const tglPendek = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
export const STATUS_LABEL = { LULUS: "Lulus", TIDAK_LULUS: "Tidak Lulus", PROSES: "Proses" };
const persen = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ====================== Rekap tahunan (murni, tanpa database) ======================

/**
 * kelasList: kelas lengkap dengan judulDiklat.materi dan pendaftaran.peserta.
 * JP dihitung hanya untuk peserta yang LULUS (JP = jumlah durasi materi diklat itu).
 */
export function agregasiTahunan(kelasList) {
  const perPeserta = new Map();
  const perInstansi = new Map();
  let totalPendaftaran = 0, totalLulus = 0, totalJp = 0;

  const kelasRows = kelasList.map((k) => {
    const jp = k.judulDiklat.materi.reduce((n, m) => n + m.durasiJp, 0);
    const lulus = k.pendaftaran.filter((p) => p.statusKelulusan === "LULUS").length;
    totalPendaftaran += k.pendaftaran.length;
    totalLulus += lulus;
    totalJp += lulus * jp;

    for (const pd of k.pendaftaran) {
      const p = pd.peserta;
      const lulusIni = pd.statusKelulusan === "LULUS";
      const a = perPeserta.get(p.id) || { nama: p.nama, nipNik: p.nipNik, instansi: p.instansi, email: p.email, kelas: 0, lulus: 0, jp: 0 };
      a.kelas += 1; if (lulusIni) { a.lulus += 1; a.jp += jp; }
      perPeserta.set(p.id, a);

      const inst = (p.instansi || "-").trim() || "-";
      const i = perInstansi.get(inst) || { instansi: inst, pesertaIds: new Set(), kelas: 0, lulus: 0, jp: 0 };
      i.pesertaIds.add(p.id); i.kelas += 1; if (lulusIni) { i.lulus += 1; i.jp += jp; }
      perInstansi.set(inst, i);
    }
    return {
      id: k.id, diklat: k.judulDiklat.nama, kode: k.judulDiklat.kode, batch: k.namaBatch,
      mulai: k.tanggalMulai, selesai: k.tanggalSelesai, lokasi: k.lokasiAtauLink, status: k.status,
      peserta: k.pendaftaran.length, lulus, persenLulus: persen(lulus, k.pendaftaran.length), jp,
    };
  });

  return {
    ringkasan: { kelas: kelasRows.length, peserta: perPeserta.size, pendaftaran: totalPendaftaran, lulus: totalLulus, persenLulus: persen(totalLulus, totalPendaftaran), totalJp },
    kelasRows,
    pesertaRows: [...perPeserta.values()].sort((a, b) => b.jp - a.jp || a.nama.localeCompare(b.nama)),
    instansiRows: [...perInstansi.values()].map((i) => ({ ...i, peserta: i.pesertaIds.size })).sort((a, b) => b.jp - a.jp || a.instansi.localeCompare(b.instansi)),
  };
}

export async function daftarTahun() {
  const rows = await prisma.kelasDiklat.findMany({ select: { tanggalMulai: true } });
  const tahun = [...new Set(rows.map((r) => new Date(r.tanggalMulai).getFullYear()))];
  const sekarang = new Date().getFullYear();
  if (!tahun.includes(sekarang)) tahun.push(sekarang);
  return tahun.sort((a, b) => b - a);
}

export async function dataTahunan(tahun) {
  const kelasList = await prisma.kelasDiklat.findMany({
    where: { tanggalMulai: { gte: new Date(`${tahun}-01-01`), lt: new Date(`${tahun + 1}-01-01`) } },
    include: { judulDiklat: { include: { materi: true } }, pendaftaran: { include: { peserta: true } } },
    orderBy: { tanggalMulai: "asc" },
  });
  return agregasiTahunan(kelasList);
}

export function excelTahunan(tahun, d) {
  return bukuExcel([
    [`Ringkasan ${tahun}`, [
      { Keterangan: "Tahun", Nilai: tahun }, { Keterangan: "Jumlah kelas", Nilai: d.ringkasan.kelas },
      { Keterangan: "Peserta (unik)", Nilai: d.ringkasan.peserta }, { Keterangan: "Total pendaftaran", Nilai: d.ringkasan.pendaftaran },
      { Keterangan: "Dinyatakan lulus", Nilai: d.ringkasan.lulus }, { Keterangan: "Persentase kelulusan (%)", Nilai: d.ringkasan.persenLulus },
      { Keterangan: "Total JP tersalurkan", Nilai: d.ringkasan.totalJp }, { Keterangan: "Dicetak", Nilai: tglPendek(new Date()) },
    ]],
    ["Daftar Kelas", d.kelasRows.map((k, i) => ({ No: i + 1, Diklat: k.diklat, Kode: k.kode, Batch: k.batch, Mulai: tglPendek(k.mulai), Selesai: tglPendek(k.selesai), Lokasi: k.lokasi, Peserta: k.peserta, Lulus: k.lulus, "Kelulusan (%)": k.persenLulus, "JP per peserta": k.jp }))],
    ["Rekap per Peserta", d.pesertaRows.map((p, i) => ({ No: i + 1, Nama: p.nama, "NIP/NIK": p.nipNik, Instansi: p.instansi, Email: p.email, "Kelas diikuti": p.kelas, Lulus: p.lulus, "Total JP (lulus)": p.jp }))],
    ["Rekap per Instansi", d.instansiRows.map((x, i) => ({ No: i + 1, Instansi: x.instansi, Peserta: x.peserta, "Kelas diikuti": x.kelas, Lulus: x.lulus, "Total JP (lulus)": x.jp }))],
  ]);
}

// ====================== Laporan satu kelas ======================

export async function excelKelas(kelasId) {
  const [kelas, rekap] = await Promise.all([
    prisma.kelasDiklat.findUnique({
      where: { id: kelasId },
      include: {
        judulDiklat: { include: { materi: true } },
        pendaftaran: { include: { peserta: true } },
        sesi: { include: { presensi: true }, orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }] },
      },
    }),
    muatRekap(kelasId),
  ]);
  if (!kelas || !rekap) return null;

  const pd = new Map(kelas.pendaftaran.map((p) => [p.pesertaId, p]));
  const urut = rekap.peserta; // sudah terurut nama
  const jumlah = (s) => urut.filter((p) => p.statusSekarang === s).length;
  const totalJp = kelas.judulDiklat.materi.reduce((n, m) => n + m.durasiJp, 0);

  const ringkasan = [
    ["Diklat", kelas.judulDiklat.nama], ["Kode / Kategori", `${kelas.judulDiklat.kode} / ${kelas.judulDiklat.kategori}`], ["Batch", kelas.namaBatch],
    ["Periode", `${tglPendek(kelas.tanggalMulai)} - ${tglPendek(kelas.tanggalSelesai)}`], ["Lokasi / Link", kelas.lokasiAtauLink],
    ["Kuota", kelas.kuota], ["Peserta terdaftar", urut.length], ["Lulus", jumlah("LULUS")], ["Tidak lulus", jumlah("TIDAK_LULUS")], ["Proses", jumlah("PROSES")],
    ["Persentase kelulusan (%)", persen(jumlah("LULUS"), urut.length)], ["Total JP", totalJp], ["Jumlah sesi", kelas.sesi.length],
    ["Syarat nilai minimal", rekap.aturan.nilaiMinimal], ["Syarat kehadiran minimal (%)", rekap.aturan.kehadiranMinimal], ["Dicetak", tglPendek(new Date())],
  ].map(([Keterangan, Nilai]) => ({ Keterangan, Nilai }));

  const peserta = urut.map((p, i) => {
    const d = pd.get(p.id);
    return { No: i + 1, Nama: p.nama, "NIP/NIK": d.peserta.nipNik, Instansi: d.peserta.instansi, Email: d.peserta.email, "Kehadiran (%)": p.kehadiran ?? "", "Nilai Akhir": p.nilaiAkhir ?? "", Status: STATUS_LABEL[p.statusSekarang], "No. Sertifikat": d.nomorSertifikat || "" };
  });

  const HURUF = { HADIR: "H", IZIN: "I", SAKIT: "S", ALPA: "A" };
  const presensi = urut.map((p) => {
    const baris = { Nama: p.nama };
    const hit = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    for (const s of kelas.sesi) {
      const st = s.presensi.find((x) => x.pesertaId === p.id)?.status;
      if (st) hit[st] += 1;
      baris[`${tglPendek(s.tanggal)} ${s.jamMulai}`] = st ? HURUF[st] : "-";
    }
    return { ...baris, Hadir: hit.HADIR, Izin: hit.IZIN, Sakit: hit.SAKIT, Alpa: hit.ALPA, "Kehadiran (%)": p.kehadiran ?? "" };
  });

  const nilai = urut.map((p) => {
    const baris = { Nama: p.nama };
    for (const k of rekap.komponen) baris[`${k.nama} (${k.bobot}%)`] = p.nilai[k.id] ?? "";
    return { ...baris, "Nilai Akhir": p.nilaiAkhir ?? "", Saran: STATUS_LABEL[p.saran] ?? "Belum lengkap", "Status Saat Ini": STATUS_LABEL[p.statusSekarang] };
  });

  return { nama: `Laporan-${kelas.judulDiklat.kode}-${kelas.namaBatch}.xlsx`, buffer: bukuExcel([["Ringkasan", ringkasan], ["Peserta", peserta], ["Presensi", presensi], ["Nilai", nilai]]) };
}
