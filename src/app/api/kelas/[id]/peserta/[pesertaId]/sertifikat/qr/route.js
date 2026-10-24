import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET: unduh PNG kode QR verifikasi untuk peserta ini (admin). Untuk ditempel ke desain sertifikat.
// Alamat dasar diambil dari APP_URL (isi dengan domain asli saat dipasang), bila kosong dari alamat yang sedang dipakai.
export async function GET(request, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const pd = await prisma.pendaftaranPeserta.findUnique({ where: { kelasId_pesertaId: { kelasId: params.id, pesertaId: params.pesertaId } } });
  if (!pd) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });
  if (pd.statusKelulusan !== "LULUS") return NextResponse.json({ error: "QR hanya untuk peserta berstatus Lulus." }, { status: 400 });

  const dasar = (process.env.APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
  const png = await QRCode.toBuffer(`${dasar}/verifikasi/${pd.id}`, { width: 800, margin: 2, errorCorrectionLevel: "M" });
  return new Response(png, { headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="QR-verifikasi-${pd.id.slice(0, 8)}.png"`, "Cache-Control": "private, no-store" } });
}
