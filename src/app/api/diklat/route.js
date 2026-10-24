import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  const data = await prisma.judulDiklat.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  if (!body.kode || !body.nama || !body.kategori) {
    return NextResponse.json({ error: "kode, nama, dan kategori wajib diisi." }, { status: 400 });
  }
  const created = await prisma.judulDiklat.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
