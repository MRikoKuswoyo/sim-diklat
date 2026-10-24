"use client";

/**
 * Halaman login. Untuk sekarang autentikasi masih disimulasikan di
 * client (DEMO_USERS) — di langkah "API routes" berikutnya, submit
 * akan diganti dengan POST ke /api/auth/login yang memverifikasi
 * passwordHash di database via bcrypt, lalu set session cookie.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Tombol "coba sebagai" hanya mengisi field — kredensial dicek di server (lihat seed.ts)
// Hanya ada saat pengembangan: pada build produksi daftar ini kosong, jadi kata sandi demo tidak ikut terkirim ke browser.
const DEMO_USERS = process.env.NODE_ENV === "production" ? [] : [
  { email: "admin@diklat.go.id", password: "Admin123!" },
  { email: "andi.saputra@pemko.go.id", password: "Peserta123!" },
];

export default function LoginPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        setError(
          data?.error ||
            (res.status >= 500
              ? `Server/database bermasalah (HTTP ${res.status}). Lihat terminal "npm run dev" untuk pesan errornya.`
              : "Gagal masuk.")
        );
        setLoading(false);
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/absen/") ? next : "/pilih"); // hanya izinkan kembali ke halaman absen
      router.refresh();
    } catch {
      setError('Tidak bisa terhubung ke server. Pastikan "npm run dev" masih berjalan.');
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper bg-cover bg-center px-4"
      style={settings?.backgroundUrl ? { backgroundImage: `url(${settings.backgroundUrl})` } : undefined}
    >
      {settings?.backgroundUrl && <div className="fixed inset-0 bg-navy/50" />}
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="mx-auto h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy">
              <span className="font-serif font-bold text-gold">SD</span>
            </div>
          )}
          <h1 className={`mt-4 font-serif text-2xl font-semibold ${settings?.backgroundUrl ? "text-white" : "text-navy"}`}>
            {settings?.namaAplikasi || "SIM Diklat"}
          </h1>
          <p className={`mt-1 text-sm ${settings?.backgroundUrl ? "text-white/80" : "text-slate-500"}`}>
            Masuk untuk mengelola atau mengikuti diklat
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-4 rounded-lg border p-6 ${
            settings?.backgroundUrl
              ? "border-white/30 bg-white/20 backdrop-blur-md"
              : "border-slate-200 bg-white"
          }`}
        >
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@instansi.go.id"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${
                settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"
              }`}
            />
          </div>
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${
                settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"
              }`}
            />
          </div>
          {error && (
            <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        {DEMO_USERS.length > 0 && <div className={`mt-4 flex items-center justify-center gap-2 text-xs ${settings?.backgroundUrl ? "text-white/80" : "text-slate-500"}`}>
          <span>Coba sebagai:</span>
          <button
            onClick={() => { setEmail(DEMO_USERS[0].email); setPassword(DEMO_USERS[0].password); }}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            Admin
          </button>
          <button
            onClick={() => { setEmail(DEMO_USERS[1].email); setPassword(DEMO_USERS[1].password); }}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
          >
            User
          </button>
        </div>}

        <p className={`mt-4 text-center text-sm ${settings?.backgroundUrl ? "text-white/90" : "text-slate-500"}`}>
          Peserta baru?{" "}
          <Link href="/register" className={`font-medium underline ${settings?.backgroundUrl ? "text-white" : "text-navy"}`}>
            Daftar akun
          </Link>
        </p>
      </div>
    </div>
  );
}
