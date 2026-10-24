import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { terblokir, catat, reset, ipDari } from "@/lib/rateLimit";

const JENDELA = 15 * 60 * 1000; // 15 menit
const MAKS_PER_AKUN = 5;        // gagal per (IP + email)
const MAKS_PER_IP = 20;         // gagal per IP
const HASH_PALSU = bcrypt.hashSync("tidak-dipakai", 10); // supaya waktu respons sama baik email ada maupun tidak

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
  }

  const ip = ipDari(request);
  const kunciAkun = `login:${ip}:${email}`;
  const kunciIp = `login:${ip}`;
  const blok = terblokir(kunciAkun, MAKS_PER_AKUN).diblokir ? terblokir(kunciAkun, MAKS_PER_AKUN) : terblokir(kunciIp, MAKS_PER_IP);
  if (blok.diblokir) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(blok.sisaDetik / 60)} menit.` },
      { status: 429, headers: { "Retry-After": String(blok.sisaDetik) } }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash || HASH_PALSU);
  if (!user || !valid) {
    catat(kunciAkun, JENDELA);
    catat(kunciIp, JENDELA);
    return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
  }
  reset(kunciAkun);

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role,
    pesertaId: user.pesertaId,
  });

  const res = NextResponse.json({ user: { nama: user.nama, email: user.email, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  return res;
}
