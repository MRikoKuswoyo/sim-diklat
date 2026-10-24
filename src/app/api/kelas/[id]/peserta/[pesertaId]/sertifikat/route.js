import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { nomorBaru } from "@/lib/nomorSertifikat";
import { notifikasiKePeserta } from "@/lib/notifikasi";

const DIR = path.join(process.cwd(), "storage", "sertifikat"); // di luar /public: tidak bisa diakses langsung
const MAX_SIZE = 5 * 1024 * 1024;

const cari = (kelasId, pesertaId) =>
  prisma.pendaftaranPeserta.findUnique({
    where: { kelasId_pesertaId: { kelasId, pesertaId } },
    include: { kelas: { include: { judulDiklat: true } } },
  });

// POST (multipart, field "file"): unggah/ganti PDF sertifikat. Hanya untuk peserta berstatus LULUS.
export async function POST(request, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const pd = await cari(params.id, params.pesertaId);
  if (!pd) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });
  if (pd.statusKelulusan !== "LULUS") return NextResponse.json({ error: "Sertifikat hanya untuk peserta berstatus Lulus." }, { status: 400 });

  const file = (await request.formData()).get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Ukuran PDF maksimal 5MB." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 4).toString() !== "%PDF") return NextResponse.json({ error: "File harus berformat PDF." }, { status: 400 });

  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, `${pd.id}.pdf`), buf);
  const updated = await prisma.pendaftaranPeserta.update({
    where: { id: pd.id },
    data: { sertifikatUrl: `/api/sertifikat/${pd.id}`, nomorSertifikat: pd.nomorSertifikat || (await nomorBaru(pd)) },
  });
  if (!pd.sertifikatUrl) await notifikasiKePeserta([pd.pesertaId], { judul: "Sertifikat kamu sudah tersedia", isi: "Kamu bisa mengunduhnya di halaman Sertifikat.", tautan: "/portal/sertifikat", email: true }); // hanya saat pertama kali
  return NextResponse.json({ sertifikatUrl: updated.sertifikatUrl, nomorSertifikat: updated.nomorSertifikat });
}

// DELETE: hapus file sertifikat (nomor tetap dipertahankan agar tidak dipakai ulang).
export async function DELETE(_request, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const pd = await cari(params.id, params.pesertaId);
  if (!pd) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });
  await unlink(path.join(DIR, `${pd.id}.pdf`)).catch(() => {});
  await prisma.pendaftaranPeserta.update({ where: { id: pd.id }, data: { sertifikatUrl: null } });
  return NextResponse.json({ ok: true });
}
