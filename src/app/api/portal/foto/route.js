import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/apiAuth";

const TIPE = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_SIZE = 1024 * 1024; // 1MB (browser sudah mengecilkan jadi ~30KB)
const DIR = path.join(process.cwd(), "public", "uploads", "avatars");

async function hapusFileLama(url) {
  if (!url?.startsWith("/uploads/avatars/")) return;
  await unlink(path.join(DIR, path.basename(url))).catch(() => {});
}

// POST: unggah/ganti foto profil milik user yang sedang login (multipart, field "foto")
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const file = (await request.formData()).get("foto");
  if (!file || typeof file === "string") return NextResponse.json({ error: "File foto tidak ditemukan." }, { status: 400 });
  const ext = TIPE[file.type];
  if (!ext) return NextResponse.json({ error: "Format harus JPG, PNG, atau WEBP." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Ukuran foto maksimal 1MB." }, { status: 400 });

  await mkdir(DIR, { recursive: true });
  const filename = `${session.sub}-${Date.now()}.${ext}`;
  await writeFile(path.join(DIR, filename), Buffer.from(await file.arrayBuffer()));

  const lama = await prisma.user.findUnique({ where: { id: session.sub }, select: { fotoUrl: true } });
  const fotoUrl = `/uploads/avatars/${filename}`;
  await prisma.user.update({ where: { id: session.sub }, data: { fotoUrl } });
  await hapusFileLama(lama?.fotoUrl);
  return NextResponse.json({ fotoUrl });
}

// DELETE: hapus foto profil
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const lama = await prisma.user.findUnique({ where: { id: session.sub }, select: { fotoUrl: true } });
  await prisma.user.update({ where: { id: session.sub }, data: { fotoUrl: null } });
  await hapusFileLama(lama?.fotoUrl);
  return NextResponse.json({ ok: true });
}
