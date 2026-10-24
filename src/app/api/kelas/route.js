import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  const data = await prisma.kelasDiklat.findMany({
    include: { judulDiklat: true, _count: { select: { pendaftaran: true } } },
    orderBy: { tanggalMulai: "desc" },
  });
  return NextResponse.json(data);
}

// Body: { judulDiklatId, namaBatch, tanggalMulai, tanggalSelesai, lokasiAtauLink, kuota }
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  const required = ["judulDiklatId", "namaBatch", "tanggalMulai", "tanggalSelesai", "lokasiAtauLink", "kuota"];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Field wajib: ${missing.join(", ")}` }, { status: 400 });
  }

  const created = await prisma.kelasDiklat.create({
    data: {
      judulDiklatId: body.judulDiklatId,
      namaBatch: body.namaBatch,
      tanggalMulai: new Date(body.tanggalMulai),
      tanggalSelesai: new Date(body.tanggalSelesai),
      lokasiAtauLink: body.lokasiAtauLink,
      kuota: Number(body.kuota),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
