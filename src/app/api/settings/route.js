import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const DEFAULTS = { logoUrl: null, backgroundUrl: null, namaAplikasi: "SIM Diklat" };

// GET: pengaturan tampilan aplikasi (logo, background, & nama). Publik —
// dipakai juga di halaman Login/Daftar yang belum ada sesi.
export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(
    settings
      ? { logoUrl: settings.logoUrl, backgroundUrl: settings.backgroundUrl, namaAplikasi: settings.namaAplikasi }
      : DEFAULTS
  );
}

// PATCH: ubah nama aplikasi dan/atau tempel link logo/background langsung (tanpa upload file).
// Body: { logoUrl?, backgroundUrl?, namaAplikasi? }
export async function PATCH(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  const data = {};
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl || null;
  if (body.backgroundUrl !== undefined) data.backgroundUrl = body.backgroundUrl || null;
  if (body.namaAplikasi !== undefined && body.namaAplikasi.trim()) data.namaAplikasi = body.namaAplikasi.trim();

  const updated = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...DEFAULTS, ...data },
  });
  return NextResponse.json(updated);
}
