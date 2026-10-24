import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET: 20 notifikasi terbaru milik user yang login + jumlah belum dibaca
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  const [items, belumDibaca] = await Promise.all([
    prisma.notifikasi.findMany({ where: { userId: session.sub }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notifikasi.count({ where: { userId: session.sub, dibaca: false } }),
  ]);
  return NextResponse.json({ belumDibaca, items: items.map((n) => ({ id: n.id, judul: n.judul, isi: n.isi, tautan: n.tautan, dibaca: n.dibaca, createdAt: n.createdAt.toISOString() })) });
}

// POST { aksi: "baca", id } | { aksi: "semua" }
export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  const { aksi, id } = await req.json().catch(() => ({}));
  if (aksi === "baca") await prisma.notifikasi.updateMany({ where: { id, userId: session.sub }, data: { dibaca: true } });
  else if (aksi === "semua") await prisma.notifikasi.updateMany({ where: { userId: session.sub, dibaca: false }, data: { dibaca: true } });
  else return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
