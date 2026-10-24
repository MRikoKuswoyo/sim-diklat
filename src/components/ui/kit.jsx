"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search, X, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10";
export const btnPrimer = "inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#223357] disabled:cursor-not-allowed disabled:opacity-50";

// ---------- Avatar berwarna (warna konsisten per nama) ----------
const WARNA = ["from-sky-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-violet-500 to-purple-600", "from-cyan-500 to-blue-600"];
export function Avatar({ nama, ukuran = "h-10 w-10", teks = "text-sm" }) {
  const n = String(nama || "?");
  const w = WARNA[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % WARNA.length];
  const inisial = n.replace(/^(Dr\.?|Ir\.?|Prof\.?|H\.?|Hj\.?)\s+/i, "").trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("").toUpperCase();
  return <span className={`${ukuran} ${teks} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${w} font-semibold text-white shadow-sm`}>{inisial}</span>;
}

// ---------- Notifikasi kecil ----------
export function useToast() {
  const [t, setT] = useState(null);
  useEffect(() => { if (!t) return; const x = setTimeout(() => setT(null), 3200); return () => clearTimeout(x); }, [t]);
  const notify = (ok, text) => setT({ ok, text, k: Date.now() });
  const el = t && (
    <div key={t.k} role="status" className={`fixed bottom-6 right-6 z-[70] flex max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.ok ? "bg-emerald-600" : "bg-rose-600"}`}>
      {t.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}{t.text}
    </div>
  );
  return [el, notify];
}

// ---------- Menu aksi baris (posisi tetap supaya tidak terpotong tabel) ----------
export function RowMenu({ items }) {
  const [pos, setPos] = useState(null);
  const tombol = useRef(null);
  useEffect(() => {
    if (!pos) return;
    const tutup = () => setPos(null);
    const klik = (e) => !e.target.closest("[data-rowmenu]") && tutup();
    document.addEventListener("mousedown", klik); window.addEventListener("scroll", tutup, true); window.addEventListener("resize", tutup);
    return () => { document.removeEventListener("mousedown", klik); window.removeEventListener("scroll", tutup, true); window.removeEventListener("resize", tutup); };
  }, [pos]);
  const daftar = items.filter(Boolean);
  function buka(e) {
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = tombol.current.getBoundingClientRect();
    const tinggi = daftar.length * 40 + 8;
    setPos({ top: r.bottom + tinggi > window.innerHeight ? r.top - tinggi - 4 : r.bottom + 4, kanan: window.innerWidth - r.right });
  }
  return (
    <>
      <button ref={tombol} onClick={buka} aria-label="Menu aksi" data-rowmenu className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><MoreHorizontal className="h-5 w-5" /></button>
      {pos && (
        <div data-rowmenu className="fixed z-[60] w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl" style={{ top: pos.top, right: pos.kanan }}>
          {daftar.map((m) => (
            <button key={m.label} onClick={(e) => { e.stopPropagation(); setPos(null); m.onClick(); }} className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition hover:bg-slate-50 ${m.danger ? "text-rose-600" : "text-slate-700"}`}>
              {m.ikon && <m.ikon className="h-4 w-4" />}{m.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- Panel form geser dari kanan ----------
export function SlideOver({ judul, deskripsi, onClose, onSubmit, saving, error, labelSimpan = "Simpan", children }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    const awal = document.body.style.overflow;
    document.addEventListener("keydown", esc); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = awal; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <style>{`@keyframes geser-masuk{from{transform:translateX(100%)}to{transform:none}}`}</style>
      <form onSubmit={onSubmit} className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" style={{ animation: "geser-masuk .22s ease-out" }}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div><h2 className="font-serif text-xl font-semibold text-navy">{judul}</h2>{deskripsi && <p className="mt-0.5 text-xs text-slate-500">{deskripsi}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {children}
          {error && <p className="rounded-lg border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button type="submit" disabled={saving} className={btnPrimer}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Menyimpan..." : labelSimpan}</button>
        </div>
      </form>
    </div>
  );
}

export const Field = ({ label, hint, children }) => (
  <div><label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>{children}{hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}</div>
);

// ---------- Dialog konfirmasi ----------
export function Konfirmasi({ judul, pesan, labelOk = "Hapus", danger = true, loading, onOk, onBatal }) {
  useEffect(() => { const esc = (e) => e.key === "Escape" && onBatal(); document.addEventListener("keydown", esc); return () => document.removeEventListener("keydown", esc); }, [onBatal]);
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onBatal()}>
      <div role="alertdialog" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${danger ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}><AlertTriangle className="h-6 w-6" /></span>
        <h3 className="mt-3 font-serif text-lg font-semibold text-navy">{judul}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{pesan}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onBatal} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button onClick={onOk} disabled={loading} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-navy hover:bg-[#223357]"}`}>{loading ? "Memproses..." : labelOk}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Kotak cari (tekan "/" untuk fokus) ----------
export function KotakCari({ value, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    const tekan = (e) => { if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { e.preventDefault(); ref.current?.focus(); } };
    document.addEventListener("keydown", tekan); return () => document.removeEventListener("keydown", tekan);
  }, []);
  return (
    <div className="relative min-w-[15rem] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-10 pr-9`} />
      {value && <button onClick={() => onChange("")} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
    </div>
  );
}

// ---------- Filter berbentuk tombol bulat ----------
export function Segmen({ pilihan, nilai, onPilih }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pilihan.map((p) => (
        <button key={p.key} onClick={() => onPilih(p.key)} aria-pressed={nilai === p.key}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${nilai === p.key ? "border-navy bg-navy text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
          {p.label}<span className={`rounded-full px-1.5 text-xs ${nilai === p.key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{p.jumlah}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Kartu ringkasan di atas halaman ----------
export function StatStrip({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, nilai, ikon: Icon, warna }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${warna}`}><Icon className="h-5 w-5" /></span>
          <div><p className="text-2xl font-semibold leading-none text-navy">{nilai}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>
        </div>
      ))}
    </div>
  );
}

export const Kosong = ({ ikon: Icon, judul, pesan, aksi }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
    <Icon className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-medium text-slate-700">{judul}</p>
    {pesan && <p className="mt-1 text-sm text-slate-400">{pesan}</p>}{aksi && <div className="mt-4">{aksi}</div>}
  </div>
);

export const JudulHalaman = ({ judul, deskripsi, aksi }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div><h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">{judul}</h1>{deskripsi && <p className="mt-1 text-sm text-slate-500">{deskripsi}</p>}</div>{aksi}
  </div>
);

// ---------- Hook: panel form + simpan/hapus ke API ----------
export function usePanel(kosong) {
  const [state, setState] = useState(null); // null = tertutup, { edit, form }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return {
    state, error, saving, setError, setSaving,
    tambah: (awal = {}) => { setError(""); setState({ edit: null, form: { ...kosong, ...awal } }); },
    ubah: (item, keForm) => { setError(""); setState({ edit: item, form: keForm(item) }); },
    set: (k) => (e) => setState((s) => ({ ...s, form: { ...s.form, [k]: e.target.value } })),
    tutup: () => setState(null),
  };
}

export function useCrud(endpoint, notify) {
  const router = useRouter();
  return {
    async simpan(id, body, pesanOk) {
      const res = await fetch(id ? `${endpoint}/${id}` : endpoint, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: d.error || "Gagal menyimpan." };
      notify(true, pesanOk || (id ? "Perubahan disimpan." : "Data ditambahkan.")); router.refresh();
      return { ok: true };
    },
    async hapus(id, pesanGagal) {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { notify(false, d.error || pesanGagal || "Gagal menghapus."); return false; }
      notify(true, "Data dihapus."); router.refresh();
      return true;
    },
  };
}
