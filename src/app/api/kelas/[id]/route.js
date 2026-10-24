import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// GET detail — bentuk respons sudah disesuaikan agar langsung bisa
// dipakai sebagai prop `kelas` pada komponen <KelasDiklatDetail />.
export async function GET(_request, { params }) {
  const kelas = await prisma.kelasDiklat.findUnique({
    where: { id: params.id },
    include: {
      judulDiklat: { include: { materi: true } },
      pendaftaran: { include: { peserta: true } },
      pengajarKelas: { include: { narasumber: true } },
      panitiaKelas: { include: { panitia: true } },
    },
  });
  if (!kelas) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  const materi = kelas.judulDiklat.materi.map((m) => ({
    id: m.id,
    judulMateri: m.judulMateri,
    durasiJp: m.durasiJp,
    narasumber: kelas.pengajarKelas
      .filter((pk) => pk.materiId === m.id)
      .map((pk) => ({ id: pk.narasumber.id, nama: pk.narasumber.nama, kepakaran: pk.narasumber.kepakaran })),
  }));

  const peserta = kelas.pendaftaran.map((pd) => ({
    id: pd.peserta.id,
    pendaftaranId: pd.id,
    nama: pd.peserta.nama,
    nipNik: pd.peserta.nipNik,
    instansi: pd.peserta.instansi,
    email: pd.peserta.email,
    nilai: pd.nilai,
    statusKelulusan: pd.statusKelulusan,
    sertifikatUrl: pd.sertifikatUrl,
  }));

  const panitia = kelas.panitiaKelas.map((pk) => ({
    id: pk.panitia.id,
    nama: pk.panitia.nama,
    peranPj: pk.peranPj,
    kontak: pk.panitia.kontak,
  }));

  return NextResponse.json({
    id: kelas.id,
    namaBatch: kelas.namaBatch,
    status: kelas.status,
    kuota: kelas.kuota,
    tanggalMulai: kelas.tanggalMulai,
    tanggalSelesai: kelas.tanggalSelesai,
    lokasiAtauLink: kelas.lokasiAtauLink,
    judulDiklat: {
      nama: kelas.judulDiklat.nama,
      kode: kelas.judulDiklat.kode,
      kategori: kelas.judulDiklat.kategori,
    },
    materi,
    peserta,
    panitia,
  });
}

export async function PUT(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json();
  const data = { ...body };
  if (data.tanggalMulai) data.tanggalMulai = new Date(data.tanggalMulai);
  if (data.tanggalSelesai) data.tanggalSelesai = new Date(data.tanggalSelesai);
  if (data.kuota) data.kuota = Number(data.kuota);

  const updated = await prisma.kelasDiklat.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  await prisma.kelasDiklat.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
