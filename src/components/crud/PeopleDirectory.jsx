"use client";

import { useMemo, useState } from "react";
import { Plus, Building2, Phone, MessageCircle, Copy, Check, Pencil, Trash2, Users, Briefcase, UserCheck, UserX } from "lucide-react";
import { Avatar, btnPrimer, inputCls, Field, SlideOver, Konfirmasi, RowMenu, KotakCari, Segmen, StatStrip, Kosong, JudulHalaman, usePanel, useCrud, useToast } from "@/components/ui/kit";

// Nomor Indonesia -> format wa.me (0812... -> 62812...)
const waLink = (no) => { let d = String(no).replace(/\D/g, ""); if (d.startsWith("0")) d = "62" + d.slice(1); return `https://wa.me/${d}`; };

/**
 * Direktori orang (Narasumber, Panitia) dengan kartu, cari, filter, dan aksi cepat.
 * fields: [{ key, label, placeholder }]  — field pertama dianggap nama.
 */
export default function PeopleDirectory({ judul, deskripsi, singular, endpoint, list, fields, chipKey, instansiKey, kontakKey, pakai, labelPakai, ikon: IkonUtama }) {
  const [toast, notify] = useToast();
  const crud = useCrud(endpoint, notify);
  const kosong = Object.fromEntries(fields.map((f) => [f.key, ""]));
  const panel = usePanel(kosong);
  const [hapusItem, setHapusItem] = useState(null); const [hapusLoading, setHapusLoading] = useState(false);
  const [q, setQ] = useState(""); const [tugas, setTugas] = useState("SEMUA"); const [chip, setChip] = useState(""); const [urut, setUrut] = useState("nama");
  const [tersalin, setTersalin] = useState("");

  const chipAda = useMemo(() => (chipKey ? [...new Set(list.map((o) => o[chipKey]))].sort() : []), [list, chipKey]);
  const bertugas = list.filter((o) => pakai(o) > 0).length;
  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return list
      .filter((o) => (tugas === "SEMUA" || (tugas === "ADA") === pakai(o) > 0) && (!chip || o[chipKey] === chip) && (!kata || fields.some((f) => String(o[f.key]).toLowerCase().includes(kata))))
      .sort(urut === "tugas" ? (a, b) => pakai(b) - pakai(a) || a.nama.localeCompare(b.nama) : (a, b) => a.nama.localeCompare(b.nama));
  }, [list, q, tugas, chip, urut, fields, chipKey, pakai]);

  const keForm = (o) => Object.fromEntries(fields.map((f) => [f.key, o[f.key]]));
  async function kirim(e) {
    e.preventDefault(); panel.setSaving(true); panel.setError("");
    const r = await crud.simpan(panel.state.edit?.id, panel.state.form);
    panel.setSaving(false); r.ok ? panel.tutup() : panel.setError(r.error);
  }
  async function hapus() { setHapusLoading(true); await crud.hapus(hapusItem.id, `Gagal menghapus (mungkin masih ditugaskan di suatu kelas).`); setHapusLoading(false); setHapusItem(null); }
  const salin = (o) => { navigator.clipboard?.writeText(o[kontakKey]); setTersalin(o.id); setTimeout(() => setTersalin(""), 1400); };
  const f = panel.state?.form;

  const statistik = [
    { label: `Total ${singular}`, nilai: list.length, ikon: Users, warna: "bg-violet-50 text-violet-600" },
    { label: "Sedang bertugas", nilai: bertugas, ikon: UserCheck, warna: "bg-emerald-50 text-emerald-600" },
    { label: "Belum bertugas", nilai: list.length - bertugas, ikon: UserX, warna: "bg-amber-50 text-amber-600" },
    instansiKey ? { label: "Instansi asal", nilai: new Set(list.map((o) => o[instansiKey])).size, ikon: Building2, warna: "bg-sky-50 text-sky-600" } : { label: "Total penugasan", nilai: list.reduce((n, o) => n + pakai(o), 0), ikon: Briefcase, warna: "bg-sky-50 text-sky-600" },
  ];

  return (
    <div className="max-w-7xl">
      <JudulHalaman judul={judul} deskripsi={deskripsi} aksi={<button onClick={() => panel.tambah()} className={btnPrimer}><Plus className="h-4 w-4" /> Tambah {singular[0].toUpperCase() + singular.slice(1)}</button>} />
      <div className="mt-6"><StatStrip items={statistik} /></div>

      <div className="mt-6"><Segmen nilai={tugas} onPilih={setTugas} pilihan={[{ key: "SEMUA", label: "Semua", jumlah: list.length }, { key: "ADA", label: "Sedang bertugas", jumlah: bertugas }, { key: "BELUM", label: "Belum bertugas", jumlah: list.length - bertugas }]} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <KotakCari value={q} onChange={setQ} placeholder={`Cari ${singular} berdasarkan nama atau kontak…  (tekan /)`} />
        {chipAda.length > 1 && <select value={chip} onChange={(e) => setChip(e.target.value)} className="max-w-[15rem] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Filter"><option value="">Semua {chipKey === "kepakaran" ? "kepakaran" : "kategori"}</option>{chipAda.map((c) => <option key={c}>{c}</option>)}</select>}
        <select value={urut} onChange={(e) => setUrut(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Urutkan"><option value="nama">Nama A–Z</option><option value="tugas">Paling sering bertugas</option></select>
      </div>
      <p className="mt-3 text-xs text-slate-400">Menampilkan {tampil.length} dari {list.length} {singular}</p>

      <div className="mt-4">
        {tampil.length === 0 ? (
          list.length === 0 ? <Kosong ikon={IkonUtama} judul={`Belum ada ${singular}`} pesan={`Tambahkan ${singular} pertama.`} aksi={<button onClick={() => panel.tambah()} className={btnPrimer}><Plus className="h-4 w-4" />Tambah</button>} />
            : <Kosong ikon={IkonUtama} judul="Tidak ada yang cocok" pesan="Coba kata kunci atau filter lain." aksi={<button onClick={() => { setQ(""); setTugas("SEMUA"); setChip(""); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">Reset filter</button>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tampil.map((o) => {
              const n = pakai(o);
              return (
                <div key={o.id} onClick={() => panel.ubah(o, keForm)} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <Avatar nama={o.nama} ukuran="h-14 w-14" teks="text-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg font-semibold leading-snug text-navy">{o.nama}</p>
                      {chipKey && <span className="mt-1 inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">{o[chipKey]}</span>}
                    </div>
                    <RowMenu items={[{ label: `Edit ${singular}`, ikon: Pencil, onClick: () => panel.ubah(o, keForm) }, { label: "Hapus", ikon: Trash2, danger: true, onClick: () => setHapusItem(o) }]} />
                  </div>
                  {instansiKey && <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Building2 className="h-4 w-4 shrink-0 text-gold" />{o[instansiKey]}</p>}
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600"><Phone className="h-4 w-4 shrink-0 text-gold" />{o[kontakKey]}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${n ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${n ? "bg-emerald-500" : "bg-slate-400"}`} />{n ? labelPakai(n) : "Belum bertugas"}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:${o[kontakKey]}`} title="Telepon" aria-label="Telepon" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-navy hover:text-navy"><Phone className="h-4 w-4" /></a>
                      <a href={waLink(o[kontakKey])} target="_blank" rel="noopener noreferrer" title="Chat WhatsApp" aria-label="WhatsApp" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-500 hover:text-emerald-600"><MessageCircle className="h-4 w-4" /></a>
                      <button onClick={() => salin(o)} title="Salin nomor" aria-label="Salin nomor" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-navy hover:text-navy">{tersalin === o.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {panel.state && (
        <SlideOver judul={panel.state.edit ? `Edit ${singular[0].toUpperCase() + singular.slice(1)}` : `Tambah ${singular[0].toUpperCase() + singular.slice(1)}`} onClose={panel.tutup} onSubmit={kirim} saving={panel.saving} error={panel.error}>
          {fields.map((fl) => <Field key={fl.key} label={fl.label} hint={fl.hint}><input required value={f[fl.key]} onChange={panel.set(fl.key)} placeholder={fl.placeholder} className={inputCls} /></Field>)}
        </SlideOver>
      )}
      {hapusItem && <Konfirmasi judul={`Hapus ${singular} "${hapusItem.nama}"?`} pesan={pakai(hapusItem) ? `Masih ditugaskan di ${pakai(hapusItem)} penugasan kelas; penghapusan bisa ditolak sampai penugasannya dilepas.` : "Data akan dihapus permanen."} loading={hapusLoading} onOk={hapus} onBatal={() => setHapusItem(null)} />}
      {toast}
    </div>
  );
}
