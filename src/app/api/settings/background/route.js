import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const ALLOWED_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_SIZE = 5 * 1024 * 1024; // 5MB, gambar background biasanya lebih besar dari logo

// POST: upload file background halaman login (multipart/form-data, field "background")
// — disimpan ke /public/uploads lalu path-nya disimpan sebagai backgroundUrl di Settings.
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("background");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File background tidak ditemukan." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Format harus PNG, JPG, atau WEBP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 5MB." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `background-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  const backgroundUrl = `/uploads/${filename}`;
  const updated = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { backgroundUrl },
    create: { id: "singleton", backgroundUrl },
  });
  return NextResponse.json(updated);
}
