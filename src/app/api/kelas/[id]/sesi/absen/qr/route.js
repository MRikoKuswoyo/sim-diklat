import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET ?sesiId=  -> PNG QR berisi <APP_URL>/absen/<kode>. APP_URL harus alamat yang bisa dibuka dari HP peserta.
export async function GET(request, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const sesiId = new URL(request.url).searchParams.get("sesiId");
  const sesi = await prisma.sesiKelas.findFirst({ where: { id: sesiId, kelasId: params.id } });
  if (!sesi?.kodeAbsen) return NextResponse.json({ error: "Absen belum dibuka." }, { status: 404 });
  const dasar = (process.env.APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
  const png = await QRCode.toBuffer(`${dasar}/absen/${sesi.kodeAbsen}`, { width: 800, margin: 2, errorCorrectionLevel: "M" });
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
