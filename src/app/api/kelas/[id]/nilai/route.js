import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { muatRekap } from "@/lib/kelulusan";
import { notifikasiKePeserta } from "@/lib/notifikasi";

const err = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
const bulat = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

export async function GET(_req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const rekap = await muatRekap(params.id);
  return rekap ? NextResponse.json(rekap) : err("Kelas tidak ditemukan.", 404);
}

// POST { aksi: "komponen", nama, bobot }  |  { aksi: "terapkan" }
export async function POST(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const body = await req.json();
  const rekap = await muatRekap(params.id);
  if (!rekap) return err("Kelas tidak ditemukan.", 404);

  if (body.aksi === "komponen") {
    const bobot = Number(body.bobot);
    if (!body.nama?.trim()) return err("Nama komponen wajib diisi.");
    if (body.nama.trim().length > 40) return err("Nama komponen maksimal 40 karakter (cukup nama singkat, mis. Pre-test).");
    if (!bulat(bobot, 1, 100)) return err("Bobot harus bilangan bulat 1-100.");
    if (rekap.totalBobot + bobot > 100) return err(`Total bobot melebihi 100% (sisa ${100 - rekap.totalBobot}%).`);
    await prisma.komponenNilai.create({ data: { kelasId: params.id, nama: body.nama.trim(), bobot } });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (body.aksi === "terapkan") {
    if (rekap.totalBobot !== 100) return err(`Total bobot harus 100% (sekarang ${rekap.totalBobot}%).`);
    const hasil = { LULUS: 0, TIDAK_LULUS: 0, PROSES: 0 };
    for (const p of rekap.peserta) {
      hasil[p.saran]++;
      if (p.saran === "PROSES") continue; // nilai belum lengkap: status tidak diubah
      await prisma.pendaftaranPeserta.update({
        where: { kelasId_pesertaId: { kelasId: params.id, pesertaId: p.id } },
        data: { nilai: p.nilaiAkhir, statusKelulusan: p.saran },
      });
      await notifikasiKePeserta([p.id], p.saran === "LULUS"
        ? { judul: "Selamat, kamu dinyatakan lulus", isi: `Nilai akhir kamu ${p.nilaiAkhir}. Sertifikat akan tersedia di portal setelah diproses admin.`, tautan: "/portal", email: true }
        : { judul: "Hasil diklat tersedia", isi: `Nilai akhir kamu ${p.nilaiAkhir}. Buka portal untuk detailnya.`, tautan: "/portal", email: true });
    }
    return NextResponse.json(hasil);
  }
  return err("Aksi tidak dikenal.");
}

// PUT { nilaiMinimal, kehadiranMinimal }
export async function PUT(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const { nilaiMinimal, kehadiranMinimal } = await req.json();
  if (!bulat(nilaiMinimal, 0, 100) || !bulat(kehadiranMinimal, 0, 100)) return err("Nilai minimal dan kehadiran minimal harus 0-100.");
  await prisma.kelasDiklat.update({ where: { id: params.id }, data: { nilaiMinimal, kehadiranMinimal } });
  return NextResponse.json({ ok: true });
}

// PATCH { komponenId, pesertaId, nilai | null }
export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const { komponenId, pesertaId, nilai } = await req.json();
  const komp = await prisma.komponenNilai.findFirst({ where: { id: komponenId, kelasId: params.id } });
  const terdaftar = await prisma.pendaftaranPeserta.findUnique({ where: { kelasId_pesertaId: { kelasId: params.id, pesertaId } } });
  if (!komp || !terdaftar) return err("Data tidak ditemukan.", 404);
  if (nilai === null) {
    await prisma.nilaiKomponen.deleteMany({ where: { komponenId, pesertaId } });
  } else {
    if (typeof nilai !== "number" || !(nilai >= 0 && nilai <= 100)) return err("Nilai harus 0-100.");
    await prisma.nilaiKomponen.upsert({ where: { komponenId_pesertaId: { komponenId, pesertaId } }, create: { komponenId, pesertaId, nilai }, update: { nilai } });
  }
  return NextResponse.json({ ok: true });
}

// DELETE ?komponenId=
export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) return err("Tidak diizinkan.", 403);
  const komponenId = new URL(req.url).searchParams.get("komponenId");
  await prisma.komponenNilai.deleteMany({ where: { id: komponenId, kelasId: params.id } });
  return NextResponse.json({ ok: true });
}
