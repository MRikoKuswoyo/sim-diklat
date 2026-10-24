import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/apiAuth";

// PATCH: peserta yang sedang login mengganti kata sandi miliknya sendiri.
// Body: { passwordLama, passwordBaru }
export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const body = await request.json();
  const passwordLama = body.passwordLama || "";
  const passwordBaru = body.passwordBaru || "";
  if (!passwordLama || !passwordBaru) {
    return NextResponse.json({ error: "Kata sandi lama dan baru wajib diisi." }, { status: 400 });
  }
  if (passwordBaru.length < 8) {
    return NextResponse.json({ error: "Kata sandi baru minimal 8 karakter." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

  const valid = await bcrypt.compare(passwordLama, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Kata sandi lama tidak sesuai." }, { status: 400 });

  const passwordHash = await bcrypt.hash(passwordBaru, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
