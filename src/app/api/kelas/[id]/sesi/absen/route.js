import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { buatKode } from "@/lib/absen";
import { notifikasiKePeserta } from "@/lib/notifikasi";

// POST { sesiId, aksi: "buka" | "tutup" }
export async function POST(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const { sesiId, aksi } = await req.json();
  const sesi = await prisma.sesiKelas.findFirst({ where: { id: sesiId, kelasId: params.id } });
  if (!sesi) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });

  if (aksi === "tutup") {
    await prisma.sesiKelas.update({ where: { id: sesi.id }, data: { kodeAbsen: null } });
    return NextResponse.json({ kodeAbsen: null });
  }
  if (aksi !== "buka") return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  if (sesi.kodeAbsen) return NextResponse.json({ kodeAbsen: sesi.kodeAbsen });

  let kode;
  do { kode = buatKode(); } while (await prisma.sesiKelas.findFirst({ where: { kodeAbsen: kode } })); // kode unik
  await prisma.sesiKelas.update({ where: { id: sesi.id }, data: { kodeAbsen: kode } });
  const daftar = await prisma.pendaftaranPeserta.findMany({ where: { kelasId: params.id }, select: { pesertaId: true } });
  await notifikasiKePeserta(daftar.map((d) => d.pesertaId), { judul: "Absen dibuka", isi: `${sesi.judul} · ${sesi.jamMulai}–${sesi.jamSelesai} WIB. Masukkan kode atau pindai QR.`, tautan: "/portal" });
  return NextResponse.json({ kodeAbsen: kode });
}
