import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { isMoodleSsoEnabled, enrolDiMoodle } from "@/lib/moodle";
import { notifikasiKePeserta } from "@/lib/notifikasi";

// POST: daftarkan peserta ke kelas ini.
// Body: { pesertaId } untuk peserta yang sudah ada, ATAU
//       { peserta: { nama, nipNik, instansi, email } } untuk peserta baru.
export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  let pesertaId = body.pesertaId;

  if (!pesertaId && body.peserta) {
    const p = await prisma.peserta.upsert({
      where: { nipNik: body.peserta.nipNik },
      update: {},
      create: body.peserta,
    });
    pesertaId = p.id;
  }
  if (!pesertaId) {
    return NextResponse.json({ error: "pesertaId atau data peserta baru wajib diisi." }, { status: 400 });
  }

  const kelas = await prisma.kelasDiklat.findUnique({
    where: { id: params.id },
    include: { _count: { select: { pendaftaran: true } } },
  });
  if (!kelas) return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
  if (kelas._count.pendaftaran >= kelas.kuota) {
    return NextResponse.json({ error: "Kuota kelas sudah penuh." }, { status: 409 });
  }

  const pendaftaran = await prisma.pendaftaranPeserta.create({
    data: { kelasId: params.id, pesertaId },
    include: { peserta: true },
  });

  await notifikasiKePeserta([pendaftaran.pesertaId], { judul: "Kamu terdaftar di sebuah kelas", isi: `Kelas ${kelas.namaBatch}. Buka portal untuk melihat jadwal dan materi.`, tautan: "/portal", email: true });

  // Sinkron ke Moodle: daftarkan ke kursus yang terhubung (kegagalan tidak membatalkan pendaftaran)
  let moodle = "tidak-terhubung";
  if (kelas.moodleCourseId && isMoodleSsoEnabled()) {
    try {
      await enrolDiMoodle({ email: pendaftaran.peserta.email, nama: pendaftaran.peserta.nama, courseId: kelas.moodleCourseId });
      moodle = "ok";
    } catch (err) {
      console.error("[moodle] enrol gagal:", err.message);
      moodle = "gagal";
    }
  }
  return NextResponse.json({ ...pendaftaran, moodle }, { status: 201 });
}
