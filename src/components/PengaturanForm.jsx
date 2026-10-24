"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function PengaturanForm({ initialLogoUrl, initialBackgroundUrl, initialNamaAplikasi }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const bgFileInputRef = useRef(null);

  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [namaAplikasi, setNamaAplikasi] = useState(initialNamaAplikasi);
  const [linkInput, setLinkInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savingNama, setSavingNama] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [backgroundUrl, setBackgroundUrl] = useState(initialBackgroundUrl);
  const [bgLinkInput, setBgLinkInput] = useState("");
  const [bgPreview, setBgPreview] = useState(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [bgError, setBgError] = useState("");
  const [bgSuccess, setBgSuccess] = useState("");

  function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file logo dulu.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);
    const res = await fetch("/api/settings/logo", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Gagal mengunggah logo.");
      return;
    }
    setLogoUrl(data.logoUrl);
    setPreview(null);
    setSuccess("Logo berhasil diperbarui.");
    router.refresh();
  }

  async function handleSaveLink(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploading(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: linkInput || null }),
    });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan link logo.");
      return;
    }
    setLogoUrl(data.logoUrl || "");
    setLinkInput("");
    setSuccess("Logo berhasil diperbarui.");
    router.refresh();
  }

  async function handleResetLogo() {
    setError("");
    setSuccess("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: null }),
    });
    if (res.ok) {
      setLogoUrl("");
      setSuccess("Logo dikembalikan ke bawaan.");
      router.refresh();
    }
  }

  async function handleSaveNama(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingNama(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namaAplikasi }),
    });
    const data = await res.json();
    setSavingNama(false);
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan nama aplikasi.");
      return;
    }
    setSuccess("Nama aplikasi berhasil disimpan.");
    router.refresh();
  }

  function handlePickBgFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgPreview(URL.createObjectURL(file));
  }

  async function handleUploadBg(e) {
    e.preventDefault();
    setBgError("");
    setBgSuccess("");
    const file = bgFileInputRef.current?.files?.[0];
    if (!file) {
      setBgError("Pilih file gambar dulu.");
      return;
    }
    setBgUploading(true);
    const formData = new FormData();
    formData.append("background", file);
    const res = await fetch("/api/settings/background", { method: "POST", body: formData });
    const data = await res.json();
    setBgUploading(false);
    if (!res.ok) {
      setBgError(data.error || "Gagal mengunggah background.");
      return;
    }
    setBackgroundUrl(data.backgroundUrl);
    setBgPreview(null);
    setBgSuccess("Background berhasil diperbarui.");
    router.refresh();
  }

  async function handleSaveBgLink(e) {
    e.preventDefault();
    setBgError("");
    setBgSuccess("");
    setBgUploading(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundUrl: bgLinkInput || null }),
    });
    const data = await res.json();
    setBgUploading(false);
    if (!res.ok) {
      setBgError(data.error || "Gagal menyimpan link background.");
      return;
    }
    setBackgroundUrl(data.backgroundUrl || "");
    setBgLinkInput("");
    setBgSuccess("Background berhasil diperbarui.");
    router.refresh();
  }

  async function handleResetBg() {
    setBgError("");
    setBgSuccess("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backgroundUrl: null }),
    });
    if (res.ok) {
      setBackgroundUrl("");
      setBgSuccess("Background dikembalikan ke bawaan (polos).");
      router.refresh();
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Logo saat ini */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-medium text-slate-700">Logo Saat Ini</p>
        <div className="flex items-center gap-4">
          {preview || logoUrl ? (
            <img src={preview || logoUrl} alt="Logo" className="h-16 w-16 rounded-full border border-slate-200 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy">
              <span className="font-serif font-bold text-gold">SD</span>
            </div>
          )}
          {logoUrl && (
            <button onClick={handleResetLogo} className="text-xs font-medium text-rose-600 underline">
              Kembalikan ke bawaan
            </button>
          )}
        </div>
      </div>

      {/* Upload file */}
      <form onSubmit={handleUpload} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-medium text-slate-700">Unggah Logo Baru</p>
        <p className="mb-3 text-xs text-slate-400">PNG, JPG, WEBP, atau SVG. Maksimal 2MB.</p>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handlePickFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#223357]" />
          <button type="submit" disabled={uploading}
            className="shrink-0 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60">
            {uploading ? "Mengunggah..." : "Unggah"}
          </button>
        </div>
      </form>

      {/* Atau tempel link */}
      <form onSubmit={handleSaveLink} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-medium text-slate-700">Atau Tempel Link Gambar</p>
        <p className="mb-3 text-xs text-slate-400">Kalau logo sudah di-hosting di tempat lain (mis. Google Drive/CDN), tempel link langsungnya di sini.</p>
        <div className="flex items-center gap-3">
          <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          <button type="submit" disabled={uploading}
            className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-60">
            Simpan
          </button>
        </div>
      </form>

      {/* Nama aplikasi */}
      <form onSubmit={handleSaveNama} className="rounded-lg border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Aplikasi</label>
        <p className="mb-3 text-xs text-slate-400">Tampil di sidebar dan halaman masuk, menggantikan "SIM Diklat".</p>
        <div className="flex items-center gap-3">
          <input value={namaAplikasi} onChange={(e) => setNamaAplikasi(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          <button type="submit" disabled={savingNama}
            className="shrink-0 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60">
            {savingNama ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>

      {error && <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {success && <p className="rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <hr className="border-slate-200" />

      {/* Background halaman login/daftar */}
      <div>
        <p className="mb-1 font-serif text-lg font-semibold text-navy">Background Halaman Masuk</p>
        <p className="mb-4 text-sm text-slate-500">
          Gambar latar untuk halaman Masuk &amp; Daftar. Form akan tampil transparan/kaca di atas gambar ini.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-medium text-slate-700">Pratinjau</p>
        <div
          className="relative flex h-40 items-center justify-center overflow-hidden rounded-md bg-navy bg-cover bg-center"
          style={{ backgroundImage: (bgPreview || backgroundUrl) ? `url(${bgPreview || backgroundUrl})` : undefined }}
        >
          <div className="absolute inset-0 bg-navy/30" />
          <div className="relative rounded-md border border-white/40 bg-white/20 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
            Contoh kartu form transparan
          </div>
        </div>
        {backgroundUrl && (
          <button onClick={handleResetBg} className="mt-3 text-xs font-medium text-rose-600 underline">
            Kembalikan ke polos (tanpa background)
          </button>
        )}
      </div>

      <form onSubmit={handleUploadBg} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-medium text-slate-700">Unggah Gambar Background</p>
        <p className="mb-3 text-xs text-slate-400">PNG, JPG, atau WEBP. Maksimal 5MB. Sebaiknya gambar landscape beresolusi besar.</p>
        <div className="flex items-center gap-3">
          <input ref={bgFileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={handlePickBgFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#223357]" />
          <button type="submit" disabled={bgUploading}
            className="shrink-0 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357] disabled:opacity-60">
            {bgUploading ? "Mengunggah..." : "Unggah"}
          </button>
        </div>
      </form>

      <form onSubmit={handleSaveBgLink} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-medium text-slate-700">Atau Tempel Link Gambar</p>
        <p className="mb-3 text-xs text-slate-400">Bisa pakai link Google Drive/CDN yang sudah publik.</p>
        <div className="flex items-center gap-3">
          <input value={bgLinkInput} onChange={(e) => setBgLinkInput(e.target.value)} placeholder="https://..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy" />
          <button type="submit" disabled={bgUploading}
            className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-60">
            Simpan
          </button>
        </div>
      </form>

      {bgError && <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{bgError}</p>}
      {bgSuccess && <p className="rounded-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{bgSuccess}</p>}
    </div>
  );
}
