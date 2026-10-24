import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// POST: tetapkan satu panitia (dengan peran/PJ) ke kelas ini.
// Body: { panitiaId, peranPj }
export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  if (!body.panitiaId || !body.peranPj) {
    return NextResponse.json({ error: "panitiaId dan peranPj wajib diisi." }, { status: 400 });
  }

  const created = await prisma.panitiaKelas.create({
    data: { kelasId: params.id, panitiaId: body.panitiaId, peranPj: body.peranPj },
  });
  return NextResponse.json(created, { status: 201 });
}
