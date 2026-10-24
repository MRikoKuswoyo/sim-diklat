"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_MENU = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/diklat", label: "Judul Diklat" },
  { href: "/materi", label: "Materi Diklat" },
  { href: "/kelas", label: "Kelas Diklat" },
  { href: "/peserta", label: "Peserta" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/laporan", label: "Laporan" },
  { href: "/narasumber", label: "Narasumber" },
  { href: "/panitia", label: "Panitia" },
  { href: "/pengaturan", label: "Pengaturan" },
];

const USER_MENU = [
  { href: "/portal", label: "Kelas Saya", exact: true },
  { href: "/portal/materi", label: "Materi & Silabus" },
  { href: "/portal/sertifikat", label: "Sertifikat" },
  { href: "/portal/profil", label: "Profil Saya" },
];

export default function Sidebar({ user, settings, drawer = false }) {
  const pathname = usePathname();
  const menu = user.role === "ADMIN" ? ADMIN_MENU : USER_MENU;
  const namaAplikasi = settings?.namaAplikasi || "SIM Diklat";

  return (
    <aside className={`flex w-56 shrink-0 flex-col bg-navy text-white ${drawer ? "h-full overflow-y-auto" : ""}`}>
      <div className="flex items-center gap-2.5 border-b border-white/10 p-4">
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt={namaAplikasi} className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
            <span className="font-serif text-xs font-bold text-gold">
              {namaAplikasi.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="font-serif text-base font-semibold leading-tight">{namaAplikasi}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {menu.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                active ? "bg-white/10 font-medium" : "text-white/80 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
