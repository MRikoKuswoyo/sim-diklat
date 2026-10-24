"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ nama: "", email: "", nipNik: "", instansi: "", password: "", konfirmasi: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.konfirmasi) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama,
          email: form.email,
          nipNik: form.nipNik,
          instansi: form.instansi,
          password: form.password,
        }),
      });
      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        setError(
          data?.error ||
            (res.status >= 500
              ? `Server/database bermasalah (HTTP ${res.status}). Lihat terminal "npm run dev" untuk pesan errornya.`
              : "Gagal mendaftar.")
        );
        setLoading(false);
        return;
      }

      router.push("/pilih");
      router.refresh();
    } catch {
      setError('Tidak bisa terhubung ke server. Pastikan "npm run dev" masih berjalan.');
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper bg-cover bg-center px-4 py-10"
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
            Daftar akun peserta untuk mengakses Portal Peserta
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-3 rounded-lg border p-6 ${
            settings?.backgroundUrl ? "border-white/30 bg-white/20 backdrop-blur-md" : "border-slate-200 bg-white"
          }`}
        >
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Nama Lengkap</label>
            <input required value={form.nama} onChange={(e) => update("nama", e.target.value)}
              placeholder="Nama sesuai identitas"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"}`} />
          </div>
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Email</label>
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
              placeholder="nama@instansi.go.id"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"}`} />
          </div>
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>NIP/NIK</label>
            <input required value={form.nipNik} onChange={(e) => update("nipNik", e.target.value)}
              placeholder="Nomor identitas kepegawaian/kependudukan"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"}`} />
            <p className={`mt-1 text-xs ${settings?.backgroundUrl ? "text-white/70" : "text-slate-400"}`}>
              Kalau kamu sudah pernah didaftarkan admin ke suatu kelas diklat, gunakan email &amp; NIP/NIK yang sama supaya data lama otomatis tertaut.
            </p>
          </div>
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Instansi</label>
            <input required value={form.instansi} onChange={(e) => update("instansi", e.target.value)}
              placeholder="Instansi/unit kerja"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"}`} />
          </div>
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Kata Sandi</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)}
              placeholder="Minimal 8 karakter"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"}`} />
          </div>
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${settings?.backgroundUrl ? "text-white" : "text-slate-700"}`}>Konfirmasi Kata Sandi</label>
            <input type="password" required minLength={8} value={form.konfirmasi} onChange={(e) => update("konfirmasi", e.target.value)}
              placeholder="Ulangi kata sandi"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-navy ${settings?.backgroundUrl ? "border-white/40 bg-white/90 placeholder:text-slate-400" : "border-slate-300"}`} />
          </div>
          {error && (
            <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-navy py-2.5 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60">
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p className={`mt-4 text-center text-sm ${settings?.backgroundUrl ? "text-white/90" : "text-slate-500"}`}>
          Sudah punya akun?{" "}
          <Link href="/login" className={`font-medium underline ${settings?.backgroundUrl ? "text-white" : "text-navy"}`}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
