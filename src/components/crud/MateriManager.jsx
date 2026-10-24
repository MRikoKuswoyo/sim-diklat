"use client";

import { useMemo, useState } from "react";
import { Plus, BookOpen, Clock, Layers, FileWarning, ChevronDown, Pencil, Trash2, ExternalLink, FileText } from "lucide-react";
import { btnPrimer, inputCls, Field, SlideOver, Konfirmasi, RowMenu, KotakCari, StatStrip, Kosong, JudulHalaman, usePanel, useCrud, useToast } from "@/components/ui/kit";

const KOSONG = { judulDiklatId: "", judulMateri: "", fileSilabusUrl: "", durasiJp: "", deskripsi: "" };

export default function MateriManager({ list, diklatOptions, awalFilter = "" }) {
  const [toast, notify] = useToast();
  const crud = useCrud("/api/materi", notify);
  const panel = usePanel(KOSONG);
  const [hapusItem, setHapusItem] = useState(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [q, setQ] = useState(""); const [diklat, setDiklat] = useState(awalFilter); const [tanpaSilabus, setTanpaSilabus] = useState(false);
  const [tertutup, setTertutup] = useState(new Set());

  const filterAktif = !!(q.trim() || diklat || tanpaSilabus);
  const kelompok = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return diklatOptions
      .filter((d) => !diklat || d.id === diklat)
      .map((d) => ({ ...d, materi: list.filter((m) => m.judulDiklatId === d.id && (!kata || [m.judulMateri, m.deskripsi].some((t) => String(t || "").toLowerCase().includes(kata))) && (!tanpaSilabus || !m.fileSilabusUrl)) }))
      .filter((d) => d.materi.length > 0 || !filterAktif);
  }, [list, diklatOptions, q, diklat, tanpaSilabus, filterAktif]);

  const totalJp = list.reduce((n, m) => n + m.durasiJp, 0);
  const keForm = (m) => ({ judulDiklatId: m.judulDiklatId, judulMateri: m.judulMateri, fileSilabusUrl: m.fileSilabusUrl || "", durasiJp: m.durasiJp, deskripsi: m.deskripsi || "" });
  async function kirim(e) {
    e.preventDefault(); panel.setSaving(true); panel.setError("");
    const r = await crud.simpan(panel.state.edit?.id, { ...panel.state.form, durasiJp: Number(panel.state.form.durasiJp) });
    panel.setSaving(false);
    r.ok ? panel.tutup() : panel.setError(r.error);
  }
  async function hapus() { setHapusLoading(true); await crud.hapus(hapusItem.id); setHapusLoading(false); setHapusItem(null); }
  const alih = (id) => setTertutup((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const f = panel.state?.form;
  const semuaTertutup = kelompok.length > 0 && kelompok.every((d) => tertutup.has(d.id));

  return (
    <div className="max-w-7xl">
      <JudulHalaman judul="Materi Diklat" deskripsi="Materi dikelompokkan per judul diklat. Durasi (JP) menjadi dasar perhitungan jam pelajaran dan sertifikat."
        aksi={<button onClick={() => panel.tambah({ judulDiklatId: diklat || diklatOptions[0]?.id || "" })} disabled={diklatOptions.length === 0} className={btnPrimer}><Plus className="h-4 w-4" /> Tambah Materi</button>} />

      <div className="mt-6"><StatStrip items={[
        { label: "Total materi", nilai: list.length, ikon: BookOpen, warna: "bg-sky-50 text-sky-600" },
        { label: "Total jam pelajaran", nilai: `${totalJp} JP`, ikon: Clock, warna: "bg-emerald-50 text-emerald-600" },
        { label: "Judul diklat bermateri", nilai: new Set(list.map((m) => m.judulDiklatId)).size, ikon: Layers, warna: "bg-violet-50 text-violet-600" },
        { label: "Belum ada silabus", nilai: list.filter((m) => !m.fileSilabusUrl).length, ikon: FileWarning, warna: "bg-amber-50 text-amber-600" },
      ]} /></div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <KotakCari value={q} onChange={setQ} placeholder="Cari judul atau deskripsi materi…  (tekan /)" />
        <select value={diklat} onChange={(e) => setDiklat(e.target.value)} className="max-w-[16rem] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Judul diklat"><option value="">Semua judul diklat</option>{diklatOptions.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}</select>
        <button onClick={() => setTanpaSilabus((v) => !v)} aria-pressed={tanpaSilabus} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${tanpaSilabus ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}><FileWarning className="h-4 w-4" />Tanpa silabus</button>
        <button onClick={() => setTertutup(semuaTertutup ? new Set() : new Set(kelompok.map((d) => d.id)))} className="text-sm font-medium text-sky-700 hover:underline">{semuaTertutup ? "Buka semua" : "Tutup semua"}</button>
      </div>

      <div className="mt-5 space-y-4">
        {diklatOptions.length === 0 && <Kosong ikon={BookOpen} judul="Belum ada Judul Diklat" pesan="Buat judul diklat dulu di menu Judul Diklat, baru tambahkan materinya." />}
        {diklatOptions.length > 0 && kelompok.length === 0 && <Kosong ikon={BookOpen} judul="Tidak ada materi yang cocok" pesan="Coba kata kunci atau filter lain." aksi={<button onClick={() => { setQ(""); setDiklat(""); setTanpaSilabus(false); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">Reset filter</button>} />}
        {kelompok.map((d) => {
          const buka = !tertutup.has(d.id);
          const jp = d.materi.reduce((n, m) => n + m.durasiJp, 0);
          return (
            <section key={d.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button onClick={() => alih(d.id)} aria-expanded={buka} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${buka ? "" : "-rotate-90"}`} />
                  <span className="truncate font-serif text-lg font-semibold text-navy">{d.nama}</span>
                </button>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{d.materi.length} materi</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{jp} JP</span>
                <button onClick={() => panel.tambah({ judulDiklatId: d.id })} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-navy transition hover:border-navy hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />Materi</button>
              </div>
              {buka && (
                d.materi.length === 0 ? <p className="border-t border-slate-100 px-5 py-6 text-center text-sm text-slate-400">Belum ada materi untuk diklat ini.</p> : (
                  <ul className="divide-y divide-slate-100 border-t border-slate-100">
                    {d.materi.map((m, i) => (
                      <li key={m.id} onClick={() => panel.ubah(m, keForm)} className="group flex cursor-pointer flex-wrap items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50/70">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/5 text-sm font-semibold text-navy">{i + 1}</span>
                        <div className="min-w-0 flex-1"><p className="font-medium text-slate-800">{m.judulMateri}</p>{m.deskripsi && <p className="line-clamp-1 text-xs text-slate-400">{m.deskripsi}</p>}</div>
                        {m.fileSilabusUrl
                          ? <a href={m.fileSilabusUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"><FileText className="h-3.5 w-3.5" />Silabus<ExternalLink className="h-3 w-3" /></a>
                          : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"><FileWarning className="h-3.5 w-3.5" />Tanpa silabus</span>}
                        <span className="w-16 text-right text-sm font-semibold text-navy">{m.durasiJp} <span className="text-xs font-normal text-slate-400">JP</span></span>
                        <RowMenu items={[{ label: "Edit materi", ikon: Pencil, onClick: () => panel.ubah(m, keForm) }, { label: "Hapus", ikon: Trash2, danger: true, onClick: () => setHapusItem(m) }]} />
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          );
        })}
      </div>

      {panel.state && (
        <SlideOver judul={panel.state.edit ? "Edit Materi" : "Tambah Materi"} deskripsi="Materi akan tersedia untuk semua kelas dari judul diklat ini." onClose={panel.tutup} onSubmit={kirim} saving={panel.saving} error={panel.error}>
          <Field label="Judul Diklat"><select required value={f.judulDiklatId} onChange={panel.set("judulDiklatId")} className={inputCls}><option value="" disabled>Pilih judul diklat</option>{diklatOptions.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}</select></Field>
          <Field label="Judul Materi"><input required value={f.judulMateri} onChange={panel.set("judulMateri")} className={inputCls} /></Field>
          <Field label="Durasi (JP)" hint="1 JP = satu jam pelajaran."><input required type="number" min="1" value={f.durasiJp} onChange={panel.set("durasiJp")} className={inputCls} /></Field>
          <Field label="Link / File Silabus (opsional)" hint="Peserta mengunduh silabus dari link ini di portal."><input value={f.fileSilabusUrl} onChange={panel.set("fileSilabusUrl")} className={inputCls} placeholder="https://..." /></Field>
          <Field label="Deskripsi"><textarea rows={4} value={f.deskripsi} onChange={panel.set("deskripsi")} className={inputCls} /></Field>
        </SlideOver>
      )}
      {hapusItem && <Konfirmasi judul={`Hapus materi "${hapusItem.judulMateri}"?`} pesan="Penugasan narasumber untuk materi ini di kelas-kelas juga ikut terhapus." loading={hapusLoading} onOk={hapus} onBatal={() => setHapusItem(null)} />}
      {toast}
    </div>
  );
}
