"use client";

import { CalendarDays, MapPin, Users, Clock } from "lucide-react";
import KelasHeaderActions from "@/components/KelasHeaderActions";

const STATUS = { BERJALAN: ["Berjalan", "bg-emerald-400"], PERSIAPAN: ["Persiapan", "bg-amber-400"], SELESAI: ["Selesai", "bg-slate-300"] };
const tgl = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const tglPendek = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

// Kepala halaman kelas: judul, status, aksi, fakta ringkas, dan garis waktu pelaksanaan
export default function KelasHero({ kelas, totalJp, waktu }) {
  const [label, titik] = STATUS[kelas.status] || STATUS.PERSIAPAN;
  const fakta = [
    [CalendarDays, "Jadwal", `${tgl(kelas.tanggalMulai)} – ${tgl(kelas.tanggalSelesai)}`],
    [MapPin, "Lokasi", kelas.lokasiAtauLink],
    [Users, "Peserta", `${kelas.peserta.length} dari ${kelas.kuota} kuota`],
    [Clock, "Total Jam Pelajaran", `${totalJp} JP`],
  ];
  return (
    <header className="mb-6 rounded-2xl bg-gradient-to-br from-navy via-[#1d2d52] to-sky-800 p-6 text-white shadow-lg sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">{kelas.judulDiklat.kode} · {kelas.judulDiklat.kategori}</p>
          <h1 className="mt-3 font-serif text-2xl font-semibold leading-snug sm:text-3xl">{kelas.judulDiklat.nama}</h1>
          <p className="mt-1 text-base text-white/75">{kelas.namaBatch}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur"><span className={`h-2 w-2 rounded-full ${titik}`} />{label}</span>
          <KelasHeaderActions kelas={kelas} />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fakta.map(([Icon, nama, nilai]) => (
          <div key={nama} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10"><Icon className="h-4 w-4 text-amber-300" /></span>
            <div className="min-w-0"><dt className="text-xs text-white/60">{nama}</dt><dd className="text-sm font-medium leading-snug">{nilai}</dd></div>
          </div>
        ))}
      </dl>

      {/* Garis waktu pelaksanaan */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-white/90">{waktu.keterangan}</span>
          <span className="text-white/60">{waktu.progres}% waktu berjalan</span>
        </div>
        <div className="relative h-2 rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-1000" style={{ width: `${waktu.progres}%` }} />
          {waktu.progres > 0 && waktu.progres < 100 && <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow" style={{ left: `${waktu.progres}%` }} />}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-white/50"><span>{tglPendek(kelas.tanggalMulai)}</span><span>{tglPendek(kelas.tanggalSelesai)}</span></div>
      </div>
    </header>
  );
}
