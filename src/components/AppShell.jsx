"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import UserMenu from "@/components/UserMenu";
import NotifikasiBell from "@/components/NotifikasiBell";

// Kerangka halaman: sidebar tetap di layar lebar, menu geser (hamburger) di HP/tablet.
export default function AppShell({ user, settings, children }) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);

  useEffect(() => { setBuka(false); }, [pathname]); // tutup menu setelah pindah halaman
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && setBuka(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);
  useEffect(() => {
    document.body.style.overflow = buka ? "hidden" : ""; // cegah halaman di belakang ikut bergulir
    return () => { document.body.style.overflow = ""; };
  }, [buka]);

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar layar lebar */}
      <div className="hidden md:flex"><Sidebar user={user} settings={settings} /></div>

      {/* Menu geser di HP */}
      {buka && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setBuka(false)} aria-hidden="true" />}
      <div className={`fixed inset-y-0 left-0 z-50 w-56 transition-transform duration-200 md:hidden ${buka ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!buka}>
        <Sidebar user={user} settings={settings} drawer />
        <button onClick={() => setBuka(false)} aria-label="Tutup menu" className="absolute right-2 top-3 rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 md:justify-end">
          <button onClick={() => setBuka(true)} aria-label="Buka menu" className="-ml-1 rounded-md p-2 text-navy hover:bg-slate-100 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-1">
            <NotifikasiBell />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
