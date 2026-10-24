import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { GraduationCap, LayoutDashboard } from "lucide-react";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moodleConfig } from "@/lib/moodle";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const PESAN_ERROR = {
  "belum-dikonfigurasi": "Alamat Moodle belum diatur di server. Hubungi admin.",
  "moodle-gagal":
    "Tidak bisa masuk otomatis ke Moodle. Pastikan Moodle sedang berjalan, lalu coba lagi. Kalau tetap gagal, hubungi admin.",
};

/**
 * Halaman "Mau ke mana?" — tampil setelah login berhasil.
 * Pilihan: Moodle (via /api/moodle/launch) atau Dashboard (Admin -> /dashboard, User -> /portal).
 */
export default async function PilihPage({ searchParams }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const bg = settings?.backgroundUrl;
  const isAdmin = session.role === "ADMIN";
  const { url: moodleUrl } = moodleConfig();
  const error = PESAN_ERROR[searchParams?.error];

  const textMain = bg ? "text-white" : "text-navy";
  const textSub = bg ? "text-white/80" : "text-slate-500";
  const card = bg
    ? "border-white/30 bg-white/20 backdrop-blur-md hover:bg-white/30"
    : "border-slate-200 bg-white hover:border-navy";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper bg-cover bg-center px-4"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      {bg && <div className="fixed inset-0 bg-navy/50" />}
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="mx-auto h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy">
              <span className="font-serif font-bold text-gold">SD</span>
            </div>
          )}
          <h1 className={`mt-4 font-serif text-2xl font-semibold ${textMain}`}>Halo, {session.nama}</h1>
          <p className={`mt-1 text-sm ${textSub}`}>Mau masuk ke mana?</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <p>{error}</p>
            {searchParams?.error === "moodle-gagal" && moodleUrl && (
              <a href={moodleUrl} className="mt-1 inline-block font-medium underline">
                Buka Moodle dan masuk manual
              </a>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <a href="/api/moodle/launch" className={`block rounded-lg border p-5 text-center transition ${card}`}>
            <GraduationCap className={`mx-auto h-8 w-8 ${bg ? "text-white" : "text-gold"}`} />
            <p className={`mt-3 font-serif text-lg font-semibold ${textMain}`}>Moodle</p>
            <p className={`mt-1 text-xs ${textSub}`}>Ruang belajar &amp; materi online</p>
          </a>

          <Link href={isAdmin ? "/dashboard" : "/portal"} className={`block rounded-lg border p-5 text-center transition ${card}`}>
            <LayoutDashboard className={`mx-auto h-8 w-8 ${bg ? "text-white" : "text-gold"}`} />
            <p className={`mt-3 font-serif text-lg font-semibold ${textMain}`}>Dashboard</p>
            <p className={`mt-1 text-xs ${textSub}`}>
              {isAdmin ? "Kelola diklat, kelas & peserta" : "Kelas, materi & sertifikat saya"}
            </p>
          </Link>
        </div>

        <div className={`mt-6 text-center text-sm ${textSub}`}>
          {session.email} ·{" "}
          <LogoutButton className={`underline ${bg ? "text-white hover:text-white/80" : "text-slate-500 hover:text-slate-700"}`} />
        </div>
      </div>
    </div>
  );
}
