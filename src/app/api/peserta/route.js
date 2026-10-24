import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q");
  const data = await prisma.peserta.findMany({
    where: q
      ? { OR: [{ nama: { contains: q, mode: "insensitive" } }, { nipNik: { contains: q } }, { instansi: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  if (!body.nama || !body.nipNik || !body.instansi || !body.email) {
    return NextResponse.json({ error: "nama, nipNik, instansi, dan email wajib diisi." }, { status: 400 });
  }
  const created = await prisma.peserta.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
