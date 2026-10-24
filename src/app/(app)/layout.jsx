import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

/**
 * Layout ini membungkus semua halaman di dalam route group (app):
 * /dashboard, /diklat, /materi, /kelas, /peserta, /narasumber,
 * /panitia, /portal — menyediakan Sidebar persisten yang menunya
 * menyesuaikan role. middleware.js sudah menolak akses tanpa sesi,
 * pengecekan di sini adalah lapis kedua sekaligus sumber data user
 * untuk Sidebar.
 */
export default async function AppLayout({ children }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const akun = await prisma.user.findUnique({ where: { id: session.sub }, select: { fotoUrl: true } }).catch(() => null);
  const user = { nama: session.nama, role: session.role, fotoUrl: akun?.fotoUrl || null };
  const settingsRow = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const settings = { logoUrl: settingsRow?.logoUrl || null, namaAplikasi: settingsRow?.namaAplikasi || "SIM Diklat" };

  return <AppShell user={user} settings={settings}>{children}</AppShell>;
}
