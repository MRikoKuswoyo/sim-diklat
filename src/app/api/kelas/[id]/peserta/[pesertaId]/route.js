import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { isiNomorBilaKosong } from "@/lib/nomorSertifikat";

// PATCH: update nilai, status kelulusan, & link sertifikat.
// Body: { nilai?, statusKelulusan?, sertifikatUrl? }
export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  const data = {};
  if (body.nilai !== undefined) data.nilai = body.nilai;
  if (body.statusKelulusan) data.statusKelulusan = body.statusKelulusan;
  if (body.sertifikatUrl !== undefined) data.sertifikatUrl = body.sertifikatUrl;

  const updated = await prisma.pendaftaranPeserta.update({
    where: { kelasId_pesertaId: { kelasId: params.id, pesertaId: params.pesertaId } },
    data,
  });
  // Lulus + sudah ada sertifikat (unggahan/tautan) tapi belum bernomor -> beri nomor otomatis
  if (updated.statusKelulusan === "LULUS" && updated.sertifikatUrl && !updated.nomorSertifikat) {
    return NextResponse.json(await isiNomorBilaKosong(updated.id));
  }
  return NextResponse.json(updated);
}

// DELETE: keluarkan peserta dari kelas ini
export async function DELETE(_request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  await prisma.pendaftaranPeserta.delete({
    where: { kelasId_pesertaId: { kelasId: params.id, pesertaId: params.pesertaId } },
  });
  return NextResponse.json({ ok: true });
}
