import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const ALLOWED_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
const MAX_SIZE = 2 * 1024 * 1024; // 2MB, cukup untuk logo

// POST: upload file logo (multipart/form-data, field "logo") — disimpan
// ke /public/uploads lalu path-nya disimpan sebagai logoUrl di Settings.
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("logo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File logo tidak ditemukan." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Format harus PNG, JPG, WEBP, atau SVG." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 2MB." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `logo-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  const logoUrl = `/uploads/${filename}`;
  const updated = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { logoUrl },
    create: { id: "singleton", logoUrl },
  });
  return NextResponse.json(updated);
}
