"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, GraduationCap, Layers, BookOpen, CalendarDays, Pencil, Trash2, CheckCircle2, FileEdit, Archive, ArrowRight } from "lucide-react";
import { Avatar, btnPrimer, inputCls, Field, SlideOver, Konfirmasi, RowMenu, KotakCari, Segmen, StatStrip, Kosong, JudulHalaman, usePanel, useCrud, useToast } from "@/components/ui/kit";

const STATUS = {
  AKTIF: { label: "Aktif", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", titik: "bg-emerald-500" },
  DRAFT: { label: "Draft", bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700", titik: "bg-amber-500" },
  SELESAI: { label: "Selesai", bar: "bg-slate-400", chip: "bg-slate-100 text-slate-600", titik: "bg-slate-400" },
};
const KOSONG = { kode: "", nama: "", deskripsi: "", kategori: "", status: "DRAFT" };
const URUT = { baru: "Terbaru ditambahkan", nama: "Nama A–Z", kelas: "Kelas terbanyak", materi: "Materi terbanyak" };

export default function DiklatManager({ list }) {
  const [toast, notify] = useToast();
  const crud = useCrud("/api/diklat", notify);
  const panel = usePanel(KOSONG);
  const [hapusItem, setHapusItem] = useState(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [q, setQ] = useState(""); const [status, setStatus] = useState("SEMUA"); const [kategori, setKategori] = useState(""); const [urut, setUrut] = useState("baru");

  const kategoriAda = useMemo(() => [...new Set(list.map((d) => d.kategori))].sort(), [list]);
  const hitung = (s) => (s === "SEMUA" ? list.length : list.filter((d) => d.status === s).length);
  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    const hasil = list.filter((d) => (status === "SEMUA" || d.status === status) && (!kategori || d.kategori === kategori) && (!kata || [d.nama, d.kode, d.kategori, d.deskripsi].some((t) => String(t || "").toLowerCase().includes(kata))));
    const urutan = { nama: (a, b) => a.nama.localeCompare(b.nama), kelas: (a, b) => b._count.kelas - a._count.kelas, materi: (a, b) => b._count.materi - a._count.materi };
    return urutan[urut] ? [...hasil].sort(urutan[urut]) : hasil;
  }, [list, q, status, kategori, urut]);

  const keForm = (d) => ({ kode: d.kode, nama: d.nama, deskripsi: d.deskripsi || "", kategori: d.kategori, status: d.status });
  async function kirim(e) {
    e.preventDefault(); panel.setSaving(true); panel.setError("");
    const r = await crud.simpan(panel.state.edit?.id, panel.state.form);
    panel.setSaving(false);
    r.ok ? panel.tutup() : panel.setError(r.error);
  }
  async function ubahStatus(d, s) { await crud.simpan(d.id, { ...keForm(d), status: s }, `${d.nama} ditandai ${STATUS[s].label}.`); }
  async function hapus() { setHapusLoading(true); await crud.hapus(hapusItem.id); setHapusLoading(false); setHapusItem(null); }
  const f = panel.state?.form;

  return (
    <div className="max-w-7xl">
      <JudulHalaman judul="Judul Diklat" deskripsi="Katalog program diklat. Setiap judul memiliki materi dan dapat dibuka sebagai beberapa kelas."
        aksi={<button onClick={() => panel.tambah()} className={btnPrimer}><Plus className="h-4 w-4" /> Tambah Diklat</button>} />

      <div className="mt-6"><StatStrip items={[
        { label: "Total judul diklat", nilai: list.length, ikon: GraduationCap, warna: "bg-sky-50 text-sky-600" },
        { label: "Berstatus aktif", nilai: hitung("AKTIF"), ikon: CheckCircle2, warna: "bg-emerald-50 text-emerald-600" },
        { label: "Total materi", nilai: list.reduce((n, d) => n + d._count.materi, 0), ikon: BookOpen, warna: "bg-violet-50 text-violet-600" },
        { label: "Kelas dibuka", nilai: list.reduce((n, d) => n + d._count.kelas, 0), ikon: CalendarDays, warna: "bg-amber-50 text-amber-600" },
      ]} /></div>

      <div className="mt-6"><Segmen nilai={status} onPilih={setStatus} pilihan={[{ key: "SEMUA", label: "Semua", jumlah: hitung("SEMUA") }, ...Object.entries(STATUS).map(([k, s]) => ({ key: k, label: s.label, jumlah: hitung(k) }))]} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <KotakCari value={q} onChange={setQ} placeholder="Cari nama, kode, kategori, atau deskripsi…  (tekan /)" />
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Kategori"><option value="">Semua kategori</option>{kategoriAda.map((k) => <option key={k}>{k}</option>)}</select>
        <select value={urut} onChange={(e) => setUrut(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Urutkan">{Object.entries(URUT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </div>
      <p className="mt-3 text-xs text-slate-400">Menampilkan {tampil.length} dari {list.length} judul diklat</p>

      <div className="mt-4">
        {tampil.length === 0 ? (
          list.length === 0
            ? <Kosong ikon={GraduationCap} judul="Belum ada Judul Diklat" pesan="Buat judul pertama untuk mulai menyusun katalog diklat." aksi={<button onClick={() => panel.tambah()} className={btnPrimer}><Plus className="h-4 w-4" />Tambah Diklat</button>} />
            : <Kosong ikon={GraduationCap} judul="Tidak ada yang cocok" pesan="Coba kata kunci atau filter lain." aksi={<button onClick={() => { setQ(""); setStatus("SEMUA"); setKategori(""); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">Reset filter</button>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tampil.map((d) => {
              const s = STATUS[d.status] || STATUS.DRAFT;
              return (
                <div key={d.id} onClick={() => panel.ubah(d, keForm)} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy hover:shadow-md">
                  <span className={`absolute inset-x-0 top-0 h-1 ${s.bar}`} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar nama={d.nama} ukuran="h-11 w-11" />
                      <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{d.kode}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{d.kategori}</span></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${s.titik}`} />{s.label}</span>
                      <RowMenu items={[
                        { label: "Edit diklat", ikon: Pencil, onClick: () => panel.ubah(d, keForm) },
                        d.status !== "AKTIF" && { label: "Tandai Aktif", ikon: CheckCircle2, onClick: () => ubahStatus(d, "AKTIF") },
                        d.status !== "DRAFT" && { label: "Tandai Draft", ikon: FileEdit, onClick: () => ubahStatus(d, "DRAFT") },
                        d.status !== "SELESAI" && { label: "Tandai Selesai", ikon: Archive, onClick: () => ubahStatus(d, "SELESAI") },
                        { label: "Hapus", ikon: Trash2, danger: true, onClick: () => setHapusItem(d) },
                      ]} />
                    </div>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold leading-snug text-navy">{d.nama}</h3>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{d.deskripsi || <span className="text-slate-300">Belum ada deskripsi.</span>}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <div className="flex gap-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4 text-gold" /><b className="text-navy">{d._count.materi}</b> materi</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold" /><b className="text-navy">{d._count.kelas}</b> kelas</span>
                    </div>
                    <Link href={`/materi?diklat=${d.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 opacity-0 transition group-hover:opacity-100 hover:underline">Lihat materi <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {panel.state && (
        <SlideOver judul={panel.state.edit ? "Edit Judul Diklat" : "Tambah Judul Diklat"} deskripsi="Judul diklat adalah induk dari materi dan kelas." onClose={panel.tutup} onSubmit={kirim} saving={panel.saving} error={panel.error}>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1"><Field label="Kode"><input required value={f.kode} onChange={panel.set("kode")} className={inputCls} placeholder="CODE-002" /></Field></div>
            <div className="col-span-2"><Field label="Kategori"><input required list="daftar-kategori" value={f.kategori} onChange={panel.set("kategori")} className={inputCls} placeholder="Teknis" /><datalist id="daftar-kategori">{kategoriAda.map((k) => <option key={k} value={k} />)}</datalist></Field></div>
          </div>
          <Field label="Nama Diklat"><input required value={f.nama} onChange={panel.set("nama")} className={inputCls} /></Field>
          <Field label="Deskripsi" hint="Tampil di kartu katalog dan membantu peserta memahami isi diklat."><textarea rows={4} value={f.deskripsi} onChange={panel.set("deskripsi")} className={inputCls} /></Field>
          <Field label="Status">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STATUS).map(([k, s]) => <button type="button" key={k} onClick={() => panel.set("status")({ target: { value: k } })} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${f.status === k ? "border-navy bg-navy text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>{s.label}</button>)}
            </div>
          </Field>
        </SlideOver>
      )}
      {hapusItem && <Konfirmasi judul={`Hapus "${hapusItem.nama}"?`} pesan={`Ini juga menghapus ${hapusItem._count.materi} materi dan ${hapusItem._count.kelas} kelas turunannya. Tindakan ini tidak bisa dibatalkan.`} loading={hapusLoading} onOk={hapus} onBatal={() => setHapusItem(null)} />}
      {toast}
    </div>
  );
}
