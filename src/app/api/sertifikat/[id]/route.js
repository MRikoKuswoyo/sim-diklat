import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/sertifikat/<pendaftaranId> — hanya Admin atau pemilik sertifikat.
export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });

  const pd = await prisma.pendaftaranPeserta.findUnique({ where: { id: params.id } });
  if (!pd) return NextResponse.json({ error: "Sertifikat tidak ditemukan." }, { status: 404 });
  if (session.role !== "ADMIN" && session.pesertaId !== pd.pesertaId) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), "storage", "sertifikat", `${pd.id}.pdf`));
    const nama = `Sertifikat-${(pd.nomorSertifikat || pd.id).replace(/[^A-Za-z0-9_-]+/g, "-")}.pdf`;
    return new Response(file, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${nama}"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "File sertifikat tidak ada." }, { status: 404 });
  }
}
