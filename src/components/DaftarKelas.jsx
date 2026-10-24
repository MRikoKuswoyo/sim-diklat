"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, LayoutGrid, Rows3, CalendarDays, MapPin, Users, CalendarCheck, Award } from "lucide-react";

const STATUS = {
  BERJALAN: { label: "Berjalan", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", titik: "bg-emerald-500" },
  PERSIAPAN: { label: "Persiapan", bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700", titik: "bg-amber-500" },
  SELESAI: { label: "Selesai", bar: "bg-slate-400", chip: "bg-slate-100 text-slate-600", titik: "bg-slate-400" },
};
const URUT = {
  terbaru: ["Terbaru dimulai", (a, b) => new Date(b.mulai) - new Date(a.mulai)],
  terlama: ["Terlama dimulai", (a, b) => new Date(a.mulai) - new Date(b.mulai)],
  nama: ["Nama A–Z", (a, b) => a.nama.localeCompare(b.nama) || a.batch.localeCompare(b.batch)],
  peserta: ["Peserta terbanyak", (a, b) => b.peserta - a.peserta],
  terisi: ["Paling terisi (kuota)", (a, b) => b.peserta / (b.kuota || 1) - a.peserta / (a.kuota || 1)],
};
const tgl = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const tglPendek = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

export default function DaftarKelas({ kelas }) {
  const cari = useRef(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("SEMUA");
  const [urut, setUrut] = useState("terbaru");
  const [tampilan, setTampilan] = useState("kartu");

  useEffect(() => {
    const tekan = (e) => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { e.preventDefault(); cari.current?.focus(); }
    };
    document.addEventListener("keydown", tekan);
    return () => document.removeEventListener("keydown", tekan);
  }, []);

  const jumlah = useMemo(() => ({ SEMUA: kelas.length, BERJALAN: 0, PERSIAPAN: 0, SELESAI: 0, ...kelas.reduce((a, k) => ({ ...a, [k.status]: (a[k.status] || 0) + 1 }), {}) }), [kelas]);
  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return kelas
      .filter((k) => (status === "SEMUA" || k.status === status) && (!kata || [k.nama, k.kode, k.batch, k.lokasi, k.kategori].some((t) => String(t).toLowerCase().includes(kata))))
      .sort(URUT[urut][1]);
  }, [kelas, q, status, urut]);

  const filter = [["SEMUA", "Semua", "bg-navy"], ["BERJALAN", "Berjalan", STATUS.BERJALAN.titik], ["PERSIAPAN", "Persiapan", STATUS.PERSIAPAN.titik], ["SELESAI", "Selesai", STATUS.SELESAI.titik]];
  const resetFilter = () => { setQ(""); setStatus("SEMUA"); };

  return (
    <div className="max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">Kelas Diklat</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola semua angkatan: jadwal, peserta, presensi, nilai, dan sertifikat.</p>
        </div>
        <Link href="/kelas/baru" className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#223357]"><Plus className="h-4 w-4" /> Kelas Baru</Link>
      </div>

      {/* Filter status */}
      <div className="mt-6 flex flex-wrap gap-2">
        {filter.map(([k, label, titik]) => (
          <button key={k} onClick={() => setStatus(k)} aria-pressed={status === k}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${status === k ? "border-navy bg-navy text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
            <span className={`h-2 w-2 rounded-full ${status === k ? "bg-white" : titik}`} />{label}
            <span className={`rounded-full px-1.5 text-xs ${status === k ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{jumlah[k]}</span>
          </button>
        ))}
      </div>

      {/* Alat: cari, urut, tampilan */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input ref={cari} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama diklat, kode, batch, atau lokasi…  (tekan /)"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10" />
          {q && <button onClick={() => setQ("")} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
        </div>
        <select value={urut} onChange={(e) => setUrut(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Urutkan">
          {Object.entries(URUT).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="group" aria-label="Tampilan">
          {[["kartu", LayoutGrid, "Kartu"], ["tabel", Rows3, "Tabel"]].map(([k, Icon, label]) => (
            <button key={k} onClick={() => setTampilan(k)} aria-pressed={tampilan === k} title={label} className={`rounded-md p-2 transition ${tampilan === k ? "bg-navy text-white" : "text-slate-500 hover:text-slate-800"}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">Menampilkan {tampil.length} dari {kelas.length} kelas</p>

      {/* Hasil */}
      {tampil.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          {kelas.length === 0 ? (
            <><p className="mt-3 font-medium text-slate-700">Belum ada Kelas Diklat</p><p className="mt-1 text-sm text-slate-400">Buat kelas pertama untuk mulai menjadwalkan diklat.</p><Link href="/kelas/baru" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Buat Kelas Baru</Link></>
          ) : (
            <><p className="mt-3 font-medium text-slate-700">Tidak ada kelas yang cocok</p><p className="mt-1 text-sm text-slate-400">Coba kata kunci atau filter lain.</p><button onClick={resetFilter} className="mt-4 rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">Reset filter</button></>
          )}
        </div>
      ) : tampilan === "kartu" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tampil.map((k) => {
            const s = STATUS[k.status] || STATUS.PERSIAPAN;
            const isi = k.kuota ? Math.min(100, Math.round((k.peserta / k.kuota) * 100)) : 0;
            return (
              <Link key={k.id} href={`/kelas/${k.id}`} className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy hover:shadow-md">
                <span className={`absolute inset-x-0 top-0 h-1 ${s.bar}`} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k.kode} · {k.kategori}</p>
                    <h3 className="mt-1 font-serif text-lg font-semibold leading-snug text-navy group-hover:underline">{k.nama}</h3>
                    <p className="text-sm text-slate-500">{k.batch}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${s.titik}`} />{s.label}</span>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-gold" />{tgl(k.mulai)} – {tgl(k.selesai)}</li>
                  <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-gold" /><span className="truncate">{k.lokasi}</span></li>
                </ul>
                <div className="mt-4">
                  <div className="flex justify-between text-xs"><span className="font-medium text-slate-600">{k.keterangan}</span><span className="text-slate-400">{k.progres}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${k.progres}%` }} /></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                  <div><p className="flex items-center justify-center gap-1 text-sm font-semibold text-navy"><Users className="h-3.5 w-3.5 text-slate-400" />{k.peserta}<span className="font-normal text-slate-400">/{k.kuota}</span></p><div className="mx-auto mt-1 h-1 w-12 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gold" style={{ width: `${isi}%` }} /></div><p className="mt-0.5 text-[11px] text-slate-400">peserta</p></div>
                  <div><p className="flex items-center justify-center gap-1 text-sm font-semibold text-navy"><CalendarCheck className="h-3.5 w-3.5 text-slate-400" />{k.sesi}</p><p className="mt-1 text-[11px] text-slate-400">sesi</p></div>
                  <div><p className="flex items-center justify-center gap-1 text-sm font-semibold text-navy"><Award className="h-3.5 w-3.5 text-slate-400" />{k.lulus}</p><p className="mt-1 text-[11px] text-slate-400">lulus</p></div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs text-slate-500"><tr>{["Diklat", "Periode", "Waktu", "Peserta", "Sesi", "Lulus", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {tampil.map((k) => {
                const s = STATUS[k.status] || STATUS.PERSIAPAN;
                return (
                  <tr key={k.id} className="cursor-pointer transition hover:bg-slate-50/70" onClick={() => (window.location.href = `/kelas/${k.id}`)}>
                    <td className="px-4 py-3"><Link href={`/kelas/${k.id}`} className="font-medium text-navy hover:underline" onClick={(e) => e.stopPropagation()}>{k.nama}</Link><span className="block text-xs text-slate-400">{k.kode} · {k.batch}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{tglPendek(k.mulai)} – {tglPendek(k.selesai)}</td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-600">{k.keterangan}</span><div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${s.bar}`} style={{ width: `${k.progres}%` }} /></div></td>
                    <td className="px-4 py-3 font-medium text-slate-700">{k.peserta}<span className="font-normal text-slate-400">/{k.kuota}</span></td>
                    <td className="px-4 py-3 text-slate-600">{k.sesi}</td><td className="px-4 py-3 text-slate-600">{k.lulus}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${s.titik}`} />{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
