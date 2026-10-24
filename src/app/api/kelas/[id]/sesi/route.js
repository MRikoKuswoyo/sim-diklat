import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const STATUS = ["HADIR", "IZIN", "SAKIT", "ALPA"];
const err = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
const sesiMilik = (id, kelasId) => prisma.sesiKelas.findFirst({ where: { id, kelasId } });

// GET: semua sesi + presensi + daftar peserta kelas
export async function GET(_req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const kelas = await prisma.kelasDiklat.findUnique({ where: { id: params.id }, select: { kehadiranMinimal: true } });
  const [sesi, pend] = await Promise.all([
    prisma.sesiKelas.findMany({ where: { kelasId: params.id }, include: { presensi: true }, orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }] }),
    prisma.pendaftaranPeserta.findMany({ where: { kelasId: params.id }, include: { peserta: { select: { id: true, nama: true } } } }),
  ]);
  return NextResponse.json({
    kehadiranMinimal: kelas?.kehadiranMinimal ?? 80,
    peserta: pend.map((p) => p.peserta).sort((a, b) => a.nama.localeCompare(b.nama)),
    sesi: sesi.map((s) => ({
      id: s.id, tanggal: s.tanggal.toISOString().slice(0, 10), jamMulai: s.jamMulai, jamSelesai: s.jamSelesai, judul: s.judul, kodeAbsen: s.kodeAbsen,
      presensi: Object.fromEntries(s.presensi.map((p) => [p.pesertaId, p.status])),
    })),
  });
}

// POST: tambah sesi { tanggal: "YYYY-MM-DD", jamMulai: "HH:MM", jamSelesai, judul }
export async function POST(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const { tanggal, jamMulai, jamSelesai, judul } = await req.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal || "")) return err("Tanggal tidak valid.");
  if (!/^\d{2}:\d{2}$/.test(jamMulai || "") || !/^\d{2}:\d{2}$/.test(jamSelesai || "")) return err("Jam tidak valid.");
  if (jamSelesai <= jamMulai) return err("Jam selesai harus setelah jam mulai.");
  if (!judul?.trim()) return err("Judul sesi wajib diisi.");
  const sesi = await prisma.sesiKelas.create({ data: { kelasId: params.id, tanggal: new Date(tanggal), jamMulai, jamSelesai, judul: judul.trim() } });
  return NextResponse.json(sesi, { status: 201 });
}

// DELETE ?sesiId=...
export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const sesiId = new URL(req.url).searchParams.get("sesiId");
  if (!(await sesiMilik(sesiId, params.id))) return err("Sesi tidak ditemukan.", 404);
  await prisma.sesiKelas.delete({ where: { id: sesiId } });
  return NextResponse.json({ ok: true });
}

// PUT: catat presensi. { sesiId, pesertaId, status|null }  atau  { sesiId, semua: "HADIR" }
export async function PUT(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const { sesiId, pesertaId, status, semua } = await req.json();
  if (!(await sesiMilik(sesiId, params.id))) return err("Sesi tidak ditemukan.", 404);

  if (semua) {
    if (!STATUS.includes(semua)) return err("Status tidak valid.");
    const pend = await prisma.pendaftaranPeserta.findMany({ where: { kelasId: params.id }, select: { pesertaId: true } });
    await prisma.$transaction(pend.map((p) => prisma.presensi.upsert({
      where: { sesiId_pesertaId: { sesiId, pesertaId: p.pesertaId } },
      create: { sesiId, pesertaId: p.pesertaId, status: semua }, update: { status: semua },
    })));
    return NextResponse.json({ ok: true });
  }

  if (!(await prisma.pendaftaranPeserta.findUnique({ where: { kelasId_pesertaId: { kelasId: params.id, pesertaId } } }))) return err("Peserta tidak terdaftar di kelas ini.", 404);
  if (status === null) {
    await prisma.presensi.deleteMany({ where: { sesiId, pesertaId } });
  } else {
    if (!STATUS.includes(status)) return err("Status tidak valid.");
    await prisma.presensi.upsert({ where: { sesiId_pesertaId: { sesiId, pesertaId } }, create: { sesiId, pesertaId, status }, update: { status } });
  }
  return NextResponse.json({ ok: true });
}
