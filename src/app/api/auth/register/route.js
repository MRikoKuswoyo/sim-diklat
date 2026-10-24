import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { terblokir, catat, ipDari } from "@/lib/rateLimit";

// POST: daftar akun mandiri untuk peserta.
// Body: { nama, email, nipNik, instansi, password }
//
// Alur:
// - Kalau email sudah ada di data Peserta (mis. sudah pernah didaftarkan
//   admin ke suatu Kelas Diklat) DAN NIP/NIK cocok -> akun baru ditautkan
//   ke data Peserta yang sudah ada itu (tidak bikin data ganda).
// - Kalau email belum ada sama sekali -> data Peserta baru dibuat sekalian.
// - Kalau email/NIK sudah dipakai akun lain -> ditolak.
export async function POST(request) {
  const kunci = `register:${ipDari(request)}`;
  const blok = terblokir(kunci, 10); // maksimal 10 pendaftaran per IP per jam
  if (blok.diblokir) {
    return NextResponse.json({ error: `Terlalu banyak pendaftaran dari alamat ini. Coba lagi dalam ${Math.ceil(blok.sisaDetik / 60)} menit.` }, { status: 429 });
  }
  catat(kunci, 60 * 60 * 1000);
  const body = await request.json();
  const nama = (body.nama || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const nipNik = (body.nipNik || "").trim();
  const instansi = (body.instansi || "").trim();
  const password = body.password || "";

  if (!nama || !email || !nipNik || !instansi || !password) {
    return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Kata sandi minimal 8 karakter." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email ini sudah terdaftar. Silakan masuk." }, { status: 409 });
  }

  const pesertaByEmail = await prisma.peserta.findUnique({ where: { email } });
  const pesertaByNik = await prisma.peserta.findUnique({ where: { nipNik } });

  let pesertaId;

  if (pesertaByEmail) {
    // Data peserta dengan email ini sudah ada (biasanya diinput admin
    // saat mendaftarkan ke kelas). Verifikasi lewat NIP/NIK sebelum ditautkan.
    if (pesertaByEmail.nipNik !== nipNik) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar di data peserta dengan NIP/NIK berbeda. Periksa kembali atau hubungi admin." },
        { status: 409 }
      );
    }
    const sudahPunyaAkun = await prisma.user.findUnique({ where: { pesertaId: pesertaByEmail.id } });
    if (sudahPunyaAkun) {
      return NextResponse.json({ error: "Data peserta ini sudah punya akun. Silakan masuk." }, { status: 409 });
    }
    pesertaId = pesertaByEmail.id;
  } else if (pesertaByNik) {
    return NextResponse.json(
      { error: "NIP/NIK ini sudah terdaftar dengan email lain. Hubungi admin kalau ini seharusnya kamu." },
      { status: 409 }
    );
  } else {
    const pesertaBaru = await prisma.peserta.create({ data: { nama, email, nipNik, instansi } });
    pesertaId = pesertaBaru.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nama, email, passwordHash, role: "USER", pesertaId },
  });

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role,
    pesertaId: user.pesertaId,
  });

  const res = NextResponse.json({ user: { nama: user.nama, email: user.email, role: user.role } }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
