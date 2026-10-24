"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilForm({ nama: namaAwal, email, nipNik, instansi: instansiAwal }) {
  const router = useRouter();

  const [nama, setNama] = useState(namaAwal);
  const [instansi, setInstansi] = useState(instansiAwal);
  const [savingProfil, setSavingProfil] = useState(false);
  const [errorProfil, setErrorProfil] = useState("");
  const [successProfil, setSuccessProfil] = useState("");

  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiBaru, setKonfirmasiBaru] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  const [successPassword, setSuccessPassword] = useState("");

  async function handleSaveProfil(e) {
    e.preventDefault();
    setErrorProfil("");
    setSuccessProfil("");
    setSavingProfil(true);
    const res = await fetch("/api/portal/profil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, instansi }),
    });
    const data = await res.json();
    setSavingProfil(false);
    if (!res.ok) {
      setErrorProfil(data.error || "Gagal menyimpan.");
      return;
    }
    setSuccessProfil("Profil berhasil diperbarui.");
    router.refresh();
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    setErrorPassword("");
    setSuccessPassword("");
    if (passwordBaru !== konfirmasiBaru) {
      setErrorPassword("Konfirmasi kata sandi baru tidak sama.");
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/portal/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordLama, passwordBaru }),
    });
    const data = await res.json();
    setSavingPassword(false);
    if (!res.ok) {
      setErrorPassword(data.error || "Gagal mengganti kata sandi.");
      return;
    }
    setPasswordLama("");
    setPasswordBaru("");
    setKonfirmasiBaru("");
    setSuccessPassword("Kata sandi berhasil diganti.");
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Data diri */}
      <form onSubmit={handleSaveProfil} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-medium text-slate-700">Data Diri</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input value={email} disabled
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
            <p className="mt-1 text-xs text-slate-400">Email dipakai untuk masuk, tidak bisa diubah sendiri. Hubungi admin kalau perlu diganti.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">NIP/NIK</label>
            <input value={nipNik} disabled
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Instansi</label>
            <input value={instansi} onChange={(e) => setInstansi(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          </div>
        </div>
        {errorProfil && <p className="mt-3 rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorProfil}</p>}
        {successProfil && <p className="mt-3 rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successProfil}</p>}
        <button type="submit" disabled={savingProfil}
          className="mt-4 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60">
          {savingProfil ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      {/* Ganti kata sandi */}
      <form onSubmit={handleSavePassword} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-medium text-slate-700">Ganti Kata Sandi</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi Lama</label>
            <input type="password" value={passwordLama} onChange={(e) => setPasswordLama(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kata Sandi Baru</label>
            <input type="password" minLength={8} value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Konfirmasi Kata Sandi Baru</label>
            <input type="password" minLength={8} value={konfirmasiBaru} onChange={(e) => setKonfirmasiBaru(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          </div>
        </div>
        {errorPassword && <p className="mt-3 rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorPassword}</p>}
        {successPassword && <p className="mt-3 rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successPassword}</p>}
        <button type="submit" disabled={savingPassword}
          className="mt-4 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60">
          {savingPassword ? "Menyimpan..." : "Ganti Kata Sandi"}
        </button>
      </form>
    </div>
  );
}
