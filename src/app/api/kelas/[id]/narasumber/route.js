import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// POST: plot satu narasumber ke satu materi dalam kelas ini.
// Body: { narasumberId, materiId }
export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  if (!body.narasumberId || !body.materiId) {
    return NextResponse.json({ error: "narasumberId dan materiId wajib diisi." }, { status: 400 });
  }

  const created = await prisma.pengajarKelas.create({
    data: { kelasId: params.id, narasumberId: body.narasumberId, materiId: body.materiId },
  });
  return NextResponse.json(created, { status: 201 });
}
