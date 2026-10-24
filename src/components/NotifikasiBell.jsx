"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

function lalu(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "baru saja";
  if (d < 3600) return `${Math.floor(d / 60)} menit lalu`;
  if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
  return `${Math.floor(d / 86400)} hari lalu`;
}

// Lonceng notifikasi di bar atas (cek ulang tiap 60 detik)
export default function NotifikasiBell() {
  const router = useRouter();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ belumDibaca: 0, items: [] });

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/notifikasi", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => { muat(); const t = setInterval(muat, 60000); return () => clearInterval(t); }, [muat]);
  useEffect(() => {
    const tutup = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", tutup); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", tutup); document.removeEventListener("keydown", esc); };
  }, []);

  async function kirim(body) {
    await fetch("/api/notifikasi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    muat();
  }
  function buka(n) {
    setOpen(false);
    if (!n.dibaca) kirim({ aksi: "baca", id: n.id });
    if (n.tautan) router.push(n.tautan);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open) muat(); }} aria-label={`Notifikasi, ${data.belumDibaca} belum dibaca`}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100">
        <Bell className="h-5 w-5" />
        {data.belumDibaca > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {data.belumDibaca > 9 ? "9+" : data.belumDibaca}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-navy">Notifikasi</p>
            {data.belumDibaca > 0 && <button onClick={() => kirim({ aksi: "semua" })} className="text-xs font-medium text-sky-700 hover:underline">Tandai semua dibaca</button>}
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {data.items.length === 0 && <li className="p-8 text-center text-sm text-slate-400">Belum ada notifikasi.</li>}
            {data.items.map((n) => (
              <li key={n.id}>
                <button onClick={() => buka(n)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.dibaca ? "" : "bg-sky-50/50"}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.dibaca ? "bg-transparent" : "bg-sky-600"}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.dibaca ? "text-slate-700" : "font-semibold text-navy"}`}>{n.judul}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.isi}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{lalu(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
