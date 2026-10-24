import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// ---------- Email (opsional): aktif bila SMTP_HOST diisi di .env ----------
let transport = null;
export function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true untuk port 465
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function buatPesanEmail({ to, judul, isi, tautan }) {
  const dasar = (process.env.APP_URL || "").replace(/\/+$/, "");
  const link = tautan && dasar ? `${dasar}${tautan}` : null;
  return {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "SIM Diklat <no-reply@localhost>",
    to,
    subject: `[SIM Diklat] ${judul}`,
    text: `${judul}\n\n${isi}${link ? `\n\nBuka: ${link}` : ""}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px"><h2 style="color:#16233F">${esc(judul)}</h2><p style="white-space:pre-line;color:#334155">${esc(isi)}</p>${link ? `<p><a href="${esc(link)}" style="background:#16233F;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Buka SIM Diklat</a></p>` : ""}<p style="color:#94a3b8;font-size:12px">Email otomatis dari SIM Diklat.</p></div>`,
  };
}

// ---------- Notifikasi dalam aplikasi (+ email bila diminta & SMTP aktif) ----------
// Aturan emas: notifikasi TIDAK PERNAH boleh menggagalkan aksi utama, jadi semua error hanya dicatat.

/** users: [{ id, email }]. data: { judul, isi, tautan?, email? } */
async function simpanDanKirim(users, { judul, isi, tautan = null, email = false }) {
  if (!users.length) return;
  try {
    await prisma.notifikasi.createMany({ data: users.map((u) => ({ userId: u.id, judul, isi, tautan })) });
  } catch (err) {
    console.error("[notifikasi] gagal menyimpan:", err.message);
  }
  const t = email ? getTransport() : null;
  if (!t) return;
  const hasil = await Promise.allSettled(users.filter((u) => u.email).map((u) => t.sendMail(buatPesanEmail({ to: u.email, judul, isi, tautan }))));
  const gagal = hasil.filter((h) => h.status === "rejected");
  if (gagal.length) console.error(`[notifikasi] ${gagal.length} email gagal terkirim:`, gagal[0].reason?.message);
}

const pilihUser = { id: true, email: true };

export async function notifikasiKePeserta(pesertaIds, data) {
  try {
    const users = await prisma.user.findMany({ where: { pesertaId: { in: pesertaIds } }, select: pilihUser });
    await simpanDanKirim(users, data);
  } catch (err) { console.error("[notifikasi]", err.message); }
}

export async function notifikasiKeSemuaPeserta(data) {
  try {
    await simpanDanKirim(await prisma.user.findMany({ where: { role: "USER" }, select: pilihUser }), data);
  } catch (err) { console.error("[notifikasi]", err.message); }
}

/** Pengingat sesi besok; dibuat sekali saja per (user, sesi) berkat kunci unik. Hanya dalam aplikasi. */
export async function buatPengingat(userId, sesi) {
  try {
    await prisma.notifikasi.upsert({
      where: { userId_kunci: { userId, kunci: `sesi-${sesi.id}-h1` } },
      create: { userId, kunci: `sesi-${sesi.id}-h1`, judul: "Pengingat: ada sesi besok", isi: `${sesi.judul} · ${sesi.jamMulai}–${sesi.jamSelesai} WIB`, tautan: "/portal" },
      update: {},
    });
  } catch (err) { console.error("[notifikasi]", err.message); }
}
