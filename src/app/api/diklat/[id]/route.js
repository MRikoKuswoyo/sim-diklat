import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(_request, { params }) {
  const data = await prisma.judulDiklat.findUnique({
    where: { id: params.id },
    include: { materi: true, kelas: true },
  });
  if (!data) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  const updated = await prisma.judulDiklat.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  await prisma.judulDiklat.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
