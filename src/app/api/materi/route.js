import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(request) {
  const judulDiklatId = request.nextUrl.searchParams.get("judulDiklatId");
  const data = await prisma.materiDiklat.findMany({
    where: judulDiklatId ? { judulDiklatId } : undefined,
    orderBy: { judulMateri: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  if (!body.judulDiklatId || !body.judulMateri || !body.durasiJp) {
    return NextResponse.json({ error: "judulDiklatId, judulMateri, dan durasiJp wajib diisi." }, { status: 400 });
  }
  const created = await prisma.materiDiklat.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
