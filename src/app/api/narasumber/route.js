import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  const data = await prisma.narasumber.findMany({ orderBy: { nama: "asc" } });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const body = await request.json();
  if (!body.nama || !body.kepakaran) {
    return NextResponse.json({ error: "nama dan kepakaran wajib diisi." }, { status: 400 });
  }
  const created = await prisma.narasumber.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
