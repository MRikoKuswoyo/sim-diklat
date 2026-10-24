"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Printer, BookOpen, Users, Award, Percent, Clock, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Avatar, KotakCari, Kosong, JudulHalaman, btnPrimer } from "@/components/ui/kit";

const tgl = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const BATAS = 15;

// Tabel dengan kolom yang bisa diurutkan dengan klik judulnya
function TabelUrut({ kolom, baris, awal, kunciBaris }) {
  const [urut, setUrut] = useState(awal);
  const [semua, setSemua] = useState(false);
  const data = useMemo(() => {
    const k = kolom.find((c) => c.key === urut.key);
    const arah = urut.arah === "asc" ? 1 : -1;
    return [...baris].sort((a, b) => (k.teks ? String(a[k.key]).localeCompare(String(b[k.key])) : a[k.key] - b[k.key]) * arah);
  }, [baris, kolom, urut]);
  const tampil = semua ? data : data.slice(0, BATAS);
  const klik = (key) => setUrut((u) => (u.key === key ? { key, arah: u.arah === "asc" ? "desc" : "asc" } : { key, arah: kolom.find((c) => c.key === key).teks ? "asc" : "desc" }));
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-500">
            <tr>{kolom.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium">
                <button onClick={() => klik(c.key)} className={`inline-flex items-center gap-1 transition hover:text-navy ${urut.key === c.key ? "text-navy" : ""}`}>
                  {c.label}{urut.key === c.key ? (urut.arah === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                </button>
              </th>))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tampil.map((r) => <tr key={kunciBaris(r)} className="transition hover:bg-slate-50/70">{kolom.map((c) => <td key={c.key} className="px-4 py-3">{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      {data.length > BATAS && (
        <button onClick={() => setSemua((s) => !s)} className="w-full border-t border-slate-100 py-3 text-sm font-medium text-sky-700 transition hover:bg-slate-50">{semua ? "Tampilkan lebih sedikit" : `Tampilkan semua (${data.length})`}</button>
      )}
    </div>
  );
}

const Batang = ({ nilai, maks, warna = "bg-gold" }) => (
  <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-navy">{nilai}</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${warna} transition-all duration-700`} style={{ width: `${maks ? (nilai / maks) * 100 : 0}%` }} /></div></div>
);

export default function LaporanView({ tahun, tahunList, data }) {
  const [tab, setTab] = useState("kelas");
  const [q, setQ] = useState("");
  const { ringkasan: r, kelasRows, pesertaRows, instansiRows } = data;
  const kata = q.trim().toLowerCase();
  const cocok = (...v) => !kata || v.some((t) => String(t).toLowerCase().includes(kata));
  const maksJp = Math.max(1, ...pesertaRows.map((p) => p.jp));
  const maksJpInst = Math.max(1, ...instansiRows.map((p) => p.jp));

  const kartu = [["Kelas", r.kelas, BookOpen, "bg-sky-50 text-sky-600"], ["Peserta (unik)", r.peserta, Users, "bg-violet-50 text-violet-600"], ["Dinyatakan lulus", r.lulus, Award, "bg-emerald-50 text-emerald-600"], ["Kelulusan", `${r.persenLulus}%`, Percent, "bg-amber-50 text-amber-600"], ["JP tersalurkan", r.totalJp, Clock, "bg-rose-50 text-rose-600"]];
  const tabs = [["kelas", "Per Kelas", kelasRows.length], ["peserta", "Per Peserta", pesertaRows.length], ["instansi", "Per Instansi", instansiRows.length]];

  const kolomKelas = [
    { key: "diklat", label: "Diklat", teks: true, render: (k) => <><Link href={`/kelas/${k.id}`} className="font-medium text-navy hover:underline">{k.diklat}</Link><span className="block text-xs text-slate-400">{k.kode} · {k.batch}</span></> },
    { key: "mulai", label: "Periode", teks: true, render: (k) => <span className="whitespace-nowrap text-slate-600">{tgl(k.mulai)} – {tgl(k.selesai)}</span> },
    { key: "peserta", label: "Peserta" }, { key: "lulus", label: "Lulus" },
    { key: "persenLulus", label: "Kelulusan", render: (k) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${k.persenLulus >= 80 ? "bg-emerald-50 text-emerald-700" : k.persenLulus >= 50 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{k.persenLulus}%</span> },
    { key: "jp", label: "JP / peserta" },
  ];
  const kolomPeserta = [
    { key: "nama", label: "Peserta", teks: true, render: (p) => <span className="flex items-center gap-3"><Avatar nama={p.nama} ukuran="h-9 w-9" teks="text-xs" /><span><span className="block font-medium text-slate-800">{p.nama}</span><span className="block font-mono text-[11px] text-slate-400">{p.nipNik}</span></span></span> },
    { key: "instansi", label: "Instansi", teks: true }, { key: "kelas", label: "Kelas" }, { key: "lulus", label: "Lulus" },
    { key: "jp", label: "Total JP", render: (p) => <Batang nilai={p.jp} maks={maksJp} /> },
  ];
  const kolomInstansi = [
    { key: "instansi", label: "Instansi", teks: true, render: (i) => <span className="font-medium text-slate-800">{i.instansi}</span> },
    { key: "peserta", label: "Peserta" }, { key: "kelas", label: "Kelas diikuti" }, { key: "lulus", label: "Lulus" },
    { key: "jp", label: "Total JP", render: (i) => <Batang nilai={i.jp} maks={maksJpInst} warna="bg-navy" /> },
  ];

  const barisKelas = kelasRows.filter((k) => cocok(k.diklat, k.kode, k.batch, k.lokasi));
  const barisPeserta = pesertaRows.filter((p) => cocok(p.nama, p.nipNik, p.instansi, p.email));
  const barisInstansi = instansiRows.filter((i) => cocok(i.instansi));
  const aktif = { kelas: barisKelas, peserta: barisPeserta, instansi: barisInstansi }[tab];

  return (
    <div className="max-w-7xl">
      <JudulHalaman judul="Laporan & Rekap" deskripsi="Rekap penyelenggaraan diklat per tahun. Tahun dihitung dari tanggal mulai kelas."
        aksi={<div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Printer className="h-4 w-4" />Cetak</button>
          <a href={`/api/laporan/tahunan?tahun=${tahun}`} className={btnPrimer}><Download className="h-4 w-4" />Unduh Excel {tahun}</a>
        </div>} />

      <div className="mt-5 flex flex-wrap gap-2 print:hidden" role="group" aria-label="Pilih tahun">
        {tahunList.map((t) => <Link key={t} href={`/laporan?tahun=${t}`} aria-current={t === tahun} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${t === tahun ? "border-navy bg-navy text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{t}</Link>)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kartu.map(([label, nilai, Icon, warna]) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${warna}`}><Icon className="h-5 w-5" /></span>
            <div><p className="text-2xl font-semibold leading-none text-navy">{nilai}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div role="tablist" className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200 print:hidden [&>*]:shrink-0">
        {tabs.map(([k, label, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === k ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{label}<span className={`rounded-full px-1.5 text-[11px] ${tab === k ? "bg-navy text-white" : "bg-slate-100 text-slate-500"}`}>{n}</span></button>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
        <KotakCari value={q} onChange={setQ} placeholder={tab === "kelas" ? "Cari diklat, kode, atau batch…  (tekan /)" : tab === "peserta" ? "Cari nama, NIP/NIK, atau instansi…  (tekan /)" : "Cari instansi…  (tekan /)"} />
        <p className="text-xs text-slate-400">{aktif.length} baris · klik judul kolom untuk mengurutkan</p>
      </div>
      {tab === "peserta" && <p className="mt-2 text-xs text-slate-400">JP dihitung hanya dari kelas yang dinyatakan lulus.</p>}

      <div className="mt-4">
        {aktif.length === 0 ? <Kosong ikon={BookOpen} judul={q ? "Tidak ada yang cocok" : "Belum ada data pada tahun ini"} pesan={q ? "Coba kata kunci lain." : "Data muncul setelah ada kelas yang dimulai pada tahun ini."} /> : (
          <>
            {tab === "kelas" && <TabelUrut kolom={kolomKelas} baris={barisKelas} awal={{ key: "mulai", arah: "desc" }} kunciBaris={(k) => k.id} />}
            {tab === "peserta" && <TabelUrut kolom={kolomPeserta} baris={barisPeserta} awal={{ key: "jp", arah: "desc" }} kunciBaris={(p) => p.email + p.nipNik} />}
            {tab === "instansi" && <TabelUrut kolom={kolomInstansi} baris={barisInstansi} awal={{ key: "jp", arah: "desc" }} kunciBaris={(i) => i.instansi} />}
          </>
        )}
      </div>
    </div>
  );
}
