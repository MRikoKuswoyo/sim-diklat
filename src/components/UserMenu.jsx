"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

function Avatar({ user, size }) {
  const inisial = String(user.nama || "?").trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("").toUpperCase();
  return user.fotoUrl ? (
    <img src={user.fotoUrl} alt="" className={`${size} shrink-0 rounded-full border border-slate-200 object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-gold`}>{inisial}</span>
  );
}

// Menu akun di pojok kanan atas (admin & peserta)
export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const tutup = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", tutup);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", tutup); document.removeEventListener("keydown", esc); };
  }, []);

  const peran = user.role === "ADMIN" ? "Administrator" : "Peserta";
  const item = "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100">
        <Avatar user={user} size="h-9 w-9" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium text-navy">{user.nama}</span>
          <span className="block text-xs text-slate-500">{peran}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Avatar user={user} size="h-11 w-11" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">{user.nama}</p>
              <p className="text-xs text-slate-500">{peran}</p>
            </div>
          </div>
          <Link href="/portal/profil" onClick={() => setOpen(false)} className={item}>Profil Saya</Link>
          <Link href="/pilih" onClick={() => setOpen(false)} className={item}>Pilih Moodle / Dashboard</Link>
          <div className="border-t border-slate-100 px-4 py-2">
            <LogoutButton className="text-sm text-rose-600 hover:underline" />
          </div>
        </div>
      )}
    </div>
  );
}
