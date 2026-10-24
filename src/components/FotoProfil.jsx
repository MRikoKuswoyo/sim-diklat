"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const UKURAN = 256; // px, hasil potong persegi

// Potong tengah menjadi persegi 256x256 lalu simpan JPEG (kecil, seragam, tidak melar)
async function kecilkan(file) {
  const bitmap = await createImageBitmap(file);
  const sisi = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = UKURAN;
  canvas.getContext("2d").drawImage(bitmap, (bitmap.width - sisi) / 2, (bitmap.height - sisi) / 2, sisi, sisi, 0, 0, UKURAN, UKURAN);
  return new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
}

export default function FotoProfil({ nama, fotoUrl }) {
  const router = useRouter();
  const input = useRef(null);
  const [foto, setFoto] = useState(fotoUrl || null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inisial = String(nama || "?").trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("").toUpperCase();

  async function pilih(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("File harus berupa gambar (JPG, PNG, atau WEBP).");
    if (file.size > 10 * 1024 * 1024) return setError("Ukuran foto asli maksimal 10MB.");
    setLoading(true);
    try {
      const blob = await kecilkan(file);
      const fd = new FormData();
      fd.append("foto", blob, "foto.jpg");
      const res = await fetch("/api/portal/foto", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Gagal mengunggah (HTTP ${res.status}).`);
      setFoto(data.fotoUrl);
      router.refresh(); // perbarui foto di sidebar
    } catch (err) {
      setError(err.message || "Foto tidak bisa diproses. Coba gambar lain.");
    } finally {
      setLoading(false);
    }
  }

  async function hapus() {
    setLoading(true); setError("");
    const res = await fetch("/api/portal/foto", { method: "DELETE" });
    setLoading(false);
    if (!res.ok) return setError("Gagal menghapus foto.");
    setFoto(null);
    router.refresh();
  }

  return (
    <div className="mb-6 flex max-w-[45rem] items-center gap-5 rounded-lg border border-slate-200 bg-white p-6">
      {foto ? (
        <img src={foto} alt="Foto profil" className="h-24 w-24 rounded-full border border-slate-200 object-cover" />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-navy font-serif text-3xl font-semibold text-gold">{inisial}</span>
      )}
      <div>
        <p className="font-medium text-navy">Foto Profil</p>
        <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, atau WEBP. Otomatis dipotong persegi.</p>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" disabled={loading} onClick={() => input.current?.click()}
            className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            {loading ? "Memproses..." : foto ? "Ganti Foto" : "Unggah Foto"}
          </button>
          {foto && !loading && <button type="button" onClick={hapus} className="text-sm text-rose-600 underline">Hapus</button>}
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pilih} />
      </div>
    </div>
  );
}
