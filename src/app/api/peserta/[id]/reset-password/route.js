import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const HURUF = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // tanpa karakter yang mirip (O/0, l/1/I)

// POST: admin membuat kata sandi sementara untuk peserta. Ditampilkan SEKALI; yang tersimpan hanya hash-nya.
export async function POST(_request, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const user = await prisma.user.findUnique({ where: { pesertaId: params.id } });
  if (!user) return NextResponse.json({ error: "Peserta ini belum punya akun login." }, { status: 404 });

  const password = Array.from({ length: 10 }, () => HURUF[randomInt(HURUF.length)]).join("");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return NextResponse.json({ password, email: user.email });
}
