import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { notifikasiKeSemuaPeserta } from "@/lib/notifikasi";

export async function POST(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const { judul, isi } = await request.json();
  if (!judul?.trim() || !isi?.trim()) return NextResponse.json({ error: "Judul dan isi wajib diisi." }, { status: 400 });
  const data = await prisma.pengumuman.create({ data: { judul: judul.trim(), isi: isi.trim() } });
  await notifikasiKeSemuaPeserta({ judul: `Pengumuman: ${data.judul}`, isi: data.isi.slice(0, 200), tautan: "/portal", email: true });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/pengumuman?id=...
export async function DELETE(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  await prisma.pengumuman.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
