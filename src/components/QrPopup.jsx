"use client";

import { useEffect } from "react";
import { X, Download } from "lucide-react";

// Pop-up QR besar (cocok diproyeksikan ke layar kelas). Tutup dengan tombol, klik latar gelap, atau Esc.
export default function QrPopup({ judul, subjudul, src, kode, catatan, unduhHref, unduhNama, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    const awal = document.body.style.overflow;
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden"; // halaman di belakang tidak ikut bergulir
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = awal; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={judul}>
      <div className="relative max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Tutup" className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-5 w-5" />
        </button>
        <h2 className="px-8 font-serif text-xl font-semibold text-navy">{judul}</h2>
        {subjudul && <p className="mt-1 text-sm text-slate-500">{subjudul}</p>}

        <img src={src} alt="Kode QR" className="mx-auto mt-4 aspect-square w-[min(70vw,55vh)] max-w-[28rem] rounded-xl border border-slate-200 bg-white" />

        {kode && (
          <>
            <p className="mt-4 text-xs text-slate-500">Atau ketik kode ini di Portal:</p>
            <p className="font-mono text-5xl font-bold tracking-[0.25em] text-navy">{kode}</p>
          </>
        )}
        {catatan && <p className="mt-3 text-xs text-slate-400">{catatan}</p>}

        <div className="mt-5 flex justify-center gap-3">
          {unduhHref && (
            <a href={unduhHref} download={unduhNama} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Unduh PNG
            </a>
          )}
          <button onClick={onClose} className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-[#223357]">Tutup</button>
        </div>
      </div>
    </div>
  );
}
