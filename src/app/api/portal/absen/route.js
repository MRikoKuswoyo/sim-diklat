import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/apiAuth";
import { statusAbsen, jendelaAbsen, jamLokal } from "@/lib/absen";

const err = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
const percobaan = new Map(); // pesertaId -> [waktu...] (batasi tebak-tebakan kode)

// POST { kode } — peserta mencatat hadir sendiri
export async function POST(req) {
  const session = await getSession();
  if (!session) return err("Silakan login dulu.", 401);
  if (!session.pesertaId) return err("Absen hanya untuk akun peserta.", 403);

  const sekarang = Date.now();
  const riwayat = (percobaan.get(session.pesertaId) || []).filter((t) => sekarang - t < 60000);
  if (riwayat.length >= 10) return err("Terlalu banyak percobaan. Coba lagi satu menit lagi.", 429);
  percobaan.set(session.pesertaId, [...riwayat, sekarang]);

  const { kode } = await req.json().catch(() => ({}));
  const k = String(kode || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(k)) return err("Kode harus 6 karakter huruf/angka.");

  const sesi = await prisma.sesiKelas.findFirst({
    where: { kodeAbsen: k, kelas: { pendaftaran: { some: { pesertaId: session.pesertaId } } } },
    include: { kelas: { include: { judulDiklat: true } } },
  });
  if (!sesi) return err("Kode tidak ditemukan, sudah ditutup, atau kamu tidak terdaftar di kelas ini.", 404);

  const st = statusAbsen(sesi);
  const { buka, tutup } = jendelaAbsen(sesi);
  if (st === "BELUM_BUKA") return err(`Absen baru bisa dilakukan mulai pukul ${jamLokal(buka)} WIB.`);
  if (st === "LEWAT") return err(`Waktu absen sudah berakhir (pukul ${jamLokal(tutup)} WIB).`);

  const info = { diklat: sesi.kelas.judulDiklat.nama, judul: sesi.judul, jam: `${sesi.jamMulai}–${sesi.jamSelesai}` };
  const ada = await prisma.presensi.findUnique({ where: { sesiId_pesertaId: { sesiId: sesi.id, pesertaId: session.pesertaId } } });
  if (ada?.status === "HADIR") return NextResponse.json({ ok: true, sudah: true, ...info });

  await prisma.presensi.upsert({
    where: { sesiId_pesertaId: { sesiId: sesi.id, pesertaId: session.pesertaId } },
    create: { sesiId: sesi.id, pesertaId: session.pesertaId, status: "HADIR" }, update: { status: "HADIR" },
  });
  return NextResponse.json({ ok: true, sudah: false, ...info });
}
