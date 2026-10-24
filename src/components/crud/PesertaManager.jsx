"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Users, UserCheck, UserX, Building2, Pencil, Trash2, KeyRound, Copy, Check, Mail, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Avatar, btnPrimer, inputCls, Field, SlideOver, Konfirmasi, RowMenu, KotakCari, Segmen, StatStrip, Kosong, JudulHalaman, usePanel, useCrud, useToast } from "@/components/ui/kit";

const KOSONG = { nama: "", nipNik: "", instansi: "", email: "" };
const URUT = { nama: ["Nama A–Z", (a, b) => a.nama.localeCompare(b.nama)], kelas: ["Kelas diikuti terbanyak", (a, b) => b._count.pendaftaran - a._count.pendaftaran], instansi: ["Instansi A–Z", (a, b) => a.instansi.localeCompare(b.instansi) || a.nama.localeCompare(b.nama)] };

function TombolSalin({ teks, label, className = "" }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(teks); setOk(true); setTimeout(() => setOk(false), 1400); }} className={`rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-navy ${className}`}>
      {ok ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function PesertaManager({ list }) {
  const [toast, notify] = useToast();
  const crud = useCrud("/api/peserta", notify);
  const panel = usePanel(KOSONG);
  const [hapusItem, setHapusItem] = useState(null); const [hapusLoading, setHapusLoading] = useState(false);
  const [resetItem, setResetItem] = useState(null); const [resetLoading, setResetLoading] = useState(false);
  const [sandi, setSandi] = useState(null); const [sandiSalin, setSandiSalin] = useState(false);
  const [q, setQ] = useState(""); const [akun, setAkun] = useState("SEMUA"); const [instansi, setInstansi] = useState(""); const [urut, setUrut] = useState("nama");
  const [halaman, setHalaman] = useState(1); const [perHalaman, setPerHalaman] = useState(10);

  const instansiAda = useMemo(() => [...new Set(list.map((p) => p.instansi))].sort(), [list]);
  const sudah = list.filter((p) => p.punyaAkun).length;
  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return list
      .filter((p) => (akun === "SEMUA" || (akun === "AKUN") === p.punyaAkun) && (!instansi || p.instansi === instansi) && (!kata || [p.nama, p.nipNik, p.email, p.instansi].some((t) => String(t).toLowerCase().includes(kata))))
      .sort(URUT[urut][1]);
  }, [list, q, akun, instansi, urut]);
  useEffect(() => { setHalaman(1); }, [q, akun, instansi, urut, perHalaman]);
  const totalHalaman = Math.max(1, Math.ceil(tampil.length / perHalaman));
  const baris = tampil.slice((halaman - 1) * perHalaman, halaman * perHalaman);

  const keForm = (p) => ({ nama: p.nama, nipNik: p.nipNik, instansi: p.instansi, email: p.email });
  async function kirim(e) {
    e.preventDefault(); panel.setSaving(true); panel.setError("");
    const r = await crud.simpan(panel.state.edit?.id, panel.state.form);
    panel.setSaving(false); r.ok ? panel.tutup() : panel.setError(r.error);
  }
  async function hapus() { setHapusLoading(true); await crud.hapus(hapusItem.id, "Gagal menghapus (mungkin masih terdaftar di suatu kelas)."); setHapusLoading(false); setHapusItem(null); }
  async function reset() {
    setResetLoading(true);
    const res = await fetch(`/api/peserta/${resetItem.id}/reset-password`, { method: "POST" });
    const d = await res.json().catch(() => null);
    setResetLoading(false);
    if (!res.ok) { setResetItem(null); return notify(false, d?.error || "Gagal mereset kata sandi."); }
    setSandi({ nama: resetItem.nama, email: d.email, password: d.password }); setSandiSalin(false); setResetItem(null);
  }
  const f = panel.state?.form;
  const mulai = tampil.length ? (halaman - 1) * perHalaman + 1 : 0;

  return (
    <div className="max-w-7xl">
      <JudulHalaman judul="Peserta" deskripsi="Data seluruh peserta diklat dan status akun login mereka."
        aksi={<button onClick={() => panel.tambah()} className={btnPrimer}><Plus className="h-4 w-4" /> Tambah Peserta</button>} />

      <div className="mt-6"><StatStrip items={[
        { label: "Total peserta", nilai: list.length, ikon: Users, warna: "bg-violet-50 text-violet-600" },
        { label: "Sudah punya akun", nilai: sudah, ikon: UserCheck, warna: "bg-emerald-50 text-emerald-600" },
        { label: "Belum mendaftar akun", nilai: list.length - sudah, ikon: UserX, warna: "bg-amber-50 text-amber-600" },
        { label: "Instansi", nilai: instansiAda.length, ikon: Building2, warna: "bg-sky-50 text-sky-600" },
      ]} /></div>

      <div className="mt-6"><Segmen nilai={akun} onPilih={setAkun} pilihan={[{ key: "SEMUA", label: "Semua", jumlah: list.length }, { key: "AKUN", label: "Sudah punya akun", jumlah: sudah }, { key: "BELUM", label: "Belum daftar", jumlah: list.length - sudah }]} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <KotakCari value={q} onChange={setQ} placeholder="Cari nama, NIP/NIK, email, atau instansi…  (tekan /)" />
        <select value={instansi} onChange={(e) => setInstansi(e.target.value)} className="max-w-[14rem] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" aria-label="Instansi"><option value="">Semua instansi</option>{instansiAda.map((i) => <option key={i}>{i}</option>)}</select>
        <label className="relative"><ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={urut} onChange={(e) => setUrut(e.target.value)} className="rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700" aria-label="Urutkan">{Object.entries(URUT).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {tampil.length > 0 && <button onClick={() => { navigator.clipboard?.writeText(tampil.map((p) => p.email).join(", ")); notify(true, `${tampil.length} email disalin.`); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><Mail className="h-4 w-4" />Salin email ({tampil.length})</button>}
      </div>

      <div className="mt-4">
        {tampil.length === 0 ? (
          list.length === 0 ? <Kosong ikon={Users} judul="Belum ada peserta" pesan="Tambahkan peserta, atau impor dari Excel lewat halaman kelas." aksi={<button onClick={() => panel.tambah()} className={btnPrimer}><Plus className="h-4 w-4" />Tambah Peserta</button>} />
            : <Kosong ikon={Users} judul="Tidak ada peserta yang cocok" pesan="Coba kata kunci atau filter lain." aksi={<button onClick={() => { setQ(""); setAkun("SEMUA"); setInstansi(""); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">Reset filter</button>} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-500"><tr>{["Peserta", "NIP/NIK", "Instansi", "Kelas", "Akun", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {baris.map((p) => (
                  <tr key={p.id} onClick={() => panel.ubah(p, keForm)} className="group cursor-pointer transition hover:bg-slate-50/70">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar nama={p.nama} /><div className="min-w-0"><p className="font-medium text-slate-800">{p.nama}</p><p className="flex items-center gap-1 text-xs text-slate-400">{p.email}<TombolSalin teks={p.email} label="Salin email" className="opacity-0 group-hover:opacity-100" /></p></div></div></td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600"><span className="inline-flex items-center gap-1">{p.nipNik}<TombolSalin teks={p.nipNik} label="Salin NIP/NIK" className="opacity-0 group-hover:opacity-100" /></span></td>
                    <td className="px-4 py-3 text-slate-600">{p.instansi}</td>
                    <td className="px-4 py-3"><span className={`inline-flex min-w-[1.75rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${p._count.pendaftaran ? "bg-navy/5 text-navy" : "bg-slate-100 text-slate-400"}`}>{p._count.pendaftaran}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${p.punyaAkun ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${p.punyaAkun ? "bg-emerald-500" : "bg-slate-400"}`} />{p.punyaAkun ? "Sudah punya akun" : "Belum daftar"}</span></td>
                    <td className="px-2 py-3 text-right"><RowMenu items={[{ label: "Edit peserta", ikon: Pencil, onClick: () => panel.ubah(p, keForm) }, p.punyaAkun && { label: "Reset kata sandi", ikon: KeyRound, onClick: () => setResetItem(p) }, { label: "Hapus", ikon: Trash2, danger: true, onClick: () => setHapusItem(p) }]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>Menampilkan {mulai}–{Math.min(halaman * perHalaman, tampil.length)} dari {tampil.length} peserta</span>
              <div className="flex items-center gap-3">
                <select value={perHalaman} onChange={(e) => setPerHalaman(Number(e.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1" aria-label="Baris per halaman">{[10, 25, 50].map((n) => <option key={n} value={n}>{n} / halaman</option>)}</select>
                <div className="flex items-center gap-1">
                  <button onClick={() => setHalaman((h) => h - 1)} disabled={halaman === 1} aria-label="Halaman sebelumnya" className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="px-2">Hal. {halaman} / {totalHalaman}</span>
                  <button onClick={() => setHalaman((h) => h + 1)} disabled={halaman === totalHalaman} aria-label="Halaman berikutnya" className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {panel.state && (
        <SlideOver judul={panel.state.edit ? "Edit Peserta" : "Tambah Peserta"} deskripsi="Email dipakai peserta untuk masuk; NIP/NIK menautkan akunnya ke data ini." onClose={panel.tutup} onSubmit={kirim} saving={panel.saving} error={panel.error}>
          <Field label="Nama lengkap"><input required value={f.nama} onChange={panel.set("nama")} className={inputCls} /></Field>
          <Field label="NIP / NIK"><input required value={f.nipNik} onChange={panel.set("nipNik")} className={`${inputCls} font-mono`} inputMode="numeric" /></Field>
          <Field label="Instansi"><input required list="daftar-instansi" value={f.instansi} onChange={panel.set("instansi")} className={inputCls} /><datalist id="daftar-instansi">{instansiAda.map((i) => <option key={i} value={i} />)}</datalist></Field>
          <Field label="Email"><input required type="email" value={f.email} onChange={panel.set("email")} className={inputCls} /></Field>
        </SlideOver>
      )}
      {hapusItem && <Konfirmasi judul={`Hapus peserta "${hapusItem.nama}"?`} pesan={hapusItem._count.pendaftaran ? `Peserta ini terdaftar di ${hapusItem._count.pendaftaran} kelas; penghapusan bisa ditolak sampai ia dikeluarkan dari kelas.` : "Data peserta akan dihapus permanen."} loading={hapusLoading} onOk={hapus} onBatal={() => setHapusItem(null)} />}
      {resetItem && <Konfirmasi danger={false} labelOk="Buat Kata Sandi Baru" judul={`Reset kata sandi ${resetItem.nama}?`} pesan="Kata sandi lamanya langsung tidak berlaku. Sistem membuat kata sandi sementara yang tampil sekali." loading={resetLoading} onOk={reset} onBatal={() => setResetItem(null)} />}
      {sandi && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><KeyRound className="h-6 w-6" /></span>
          <h3 className="mt-3 font-serif text-lg font-semibold text-navy">Kata Sandi Sementara</h3>
          <p className="mt-1 text-sm text-slate-500">Untuk <b>{sandi.nama}</b> ({sandi.email}). Sampaikan ke peserta dan minta ia menggantinya di Profil Saya.</p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"><code className="text-xl font-semibold tracking-wider text-navy">{sandi.password}</code><button onClick={() => { navigator.clipboard?.writeText(sandi.password); setSandiSalin(true); }} className="text-sm font-medium text-sky-700 hover:underline">{sandiSalin ? "Tersalin" : "Salin"}</button></div>
          <p className="mt-3 text-xs text-rose-600">Hanya tampil sekali. Jika jendela ditutup, lakukan reset lagi.</p>
          <button onClick={() => setSandi(null)} className={`${btnPrimer} mt-4 w-full`}>Selesai</button>
        </div></div>
      )}
      {toast}
    </div>
  );
}
