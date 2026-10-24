import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/apiAuth";

// PATCH: peserta yang sedang login memperbarui nama & instansi miliknya sendiri.
// Body: { nama, instansi }
export async function PATCH(request) {
  const session = await getSession();
  if (!session?.pesertaId) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  const nama = (body.nama || "").trim();
  const instansi = (body.instansi || "").trim();
  if (!nama || !instansi) {
    return NextResponse.json({ error: "Nama dan instansi wajib diisi." }, { status: 400 });
  }

  await prisma.peserta.update({ where: { id: session.pesertaId }, data: { nama, instansi } });
  const user = await prisma.user.update({ where: { id: session.sub }, data: { nama } });

  return NextResponse.json({ nama: user.nama, instansi });
}
