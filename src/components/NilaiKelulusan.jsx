"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";

const SARAN = {
  LULUS: ["Lulus", "bg-emerald-50 text-emerald-700"],
  TIDAK_LULUS: ["Tidak Lulus", "bg-rose-50 text-rose-700"],
  PROSES: ["Belum lengkap", "bg-slate-100 text-slate-500"],
};
const STATUS = { LULUS: "Lulus", TIDAK_LULUS: "Tidak Lulus", PROSES: "Proses" };
const inp = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-navy";

export default function NilaiKelulusan({ kelasId }) {
  const base = `/api/kelas/${kelasId}/nilai`;
  const [data, setData] = useState(null);
  const [aturan, setAturan] = useState(null);
  const [baru, setBaru] = useState({ nama: "", bobot: "" });
  const [msg, setMsg] = useState(null); // { ok, text }

  const muat = useCallback(async () => {
    const res = await fetch(base);
    if (!res.ok) return setMsg({ ok: false, text: "Gagal memuat data nilai." });
    const d = await res.json();
    setData(d);
    setAturan((a) => a ?? d.aturan);
  }, [base]);
  useEffect(() => { muat(); }, [muat]);

  const kirim = async (method, body, query = "") => {
    const res = await fetch(base + query, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => null);
    if (!res.ok) { setMsg({ ok: false, text: d?.error || `Gagal (HTTP ${res.status}).` }); return null; }
    setMsg(null);
    return d;
  };

  async function simpanAturan() {
    if (await kirim("PUT", { nilaiMinimal: Number(aturan.nilaiMinimal), kehadiranMinimal: Number(aturan.kehadiranMinimal) })) {
      setMsg({ ok: true, text: "Aturan kelulusan disimpan." });
      muat();
    }
  }
  async function tambahKomponen(e) {
    e.preventDefault();
    if (await kirim("POST", { aksi: "komponen", nama: baru.nama, bobot: Number(baru.bobot) })) { setBaru({ nama: "", bobot: "" }); muat(); }
  }
  const TEMPLATE = [["Pre-test", 10], ["Tugas", 30], ["Post-test", 60]];
  async function aturUlang() {
    for (const k of data.komponen) await kirim("DELETE", null, `?komponenId=${k.id}`);
    for (const [nama, bobot] of TEMPLATE) {
      if (!(await kirim("POST", { aksi: "komponen", nama, bobot }))) break;
    }
    setMsg({ ok: true, text: "Komponen diatur ulang: Pre-test 10%, Tugas 30%, Post-test 60%. Silakan isi nilai peserta." });
    muat();
  }
  async function pakaiTemplate() {
    for (const [nama, bobot] of [["Pre-test", 10], ["Tugas", 30], ["Post-test", 60]]) {
      if (!(await kirim("POST", { aksi: "komponen", nama, bobot }))) break;
    }
    muat();
  }
  async function hapusKomponen(k) {
    if (!confirm(`Hapus komponen "${k.nama}" beserta semua nilainya?`)) return;
    await kirim("DELETE", null, `?komponenId=${k.id}`);
    muat();
  }
  async function simpanNilai(komponenId, pesertaId, teks, lama) {
    const t = teks.trim().replace(",", ".");
    const nilai = t === "" ? null : Number(t);
    if (nilai === (lama ?? null)) return;
    if (nilai !== null && !(nilai >= 0 && nilai <= 100)) return setMsg({ ok: false, text: "Nilai harus antara 0 dan 100." });
    if (await kirim("PATCH", { komponenId, pesertaId, nilai })) muat();
  }
  function alasanBelumSiap() {
    if (peserta.length === 0) return alert("Belum ada peserta di kelas ini.");
    if (confirm(`Belum bisa diterapkan: total bobot komponen masih ${totalBobot}% (harus tepat 100%).\n\nAtur ulang otomatis ke template Pre-test 10% · Tugas 30% · Post-test 60%?\n\nKomponen dan nilai yang ada sekarang akan dihapus.`)) aturUlang();
  }
  async function terapkan() {
    const sem = data.peserta;
    const lulus = sem.filter((p) => p.saran === "LULUS").length, tidak = sem.filter((p) => p.saran === "TIDAK_LULUS").length, proses = sem.length - lulus - tidak;
    if (!confirm(`Terapkan hasil ke status kelulusan?\n\n• Lulus: ${lulus}\n• Tidak lulus: ${tidak}\n• Nilai belum lengkap (status tidak diubah): ${proses}\n\nStatus dan nilai akhir peserta akan diperbarui.`)) return;
    const d = await kirim("POST", { aksi: "terapkan" });
    if (d) { setMsg({ ok: true, text: `Selesai: ${d.LULUS} lulus, ${d.TIDAK_LULUS} tidak lulus, ${d.PROSES} dilewati (nilai belum lengkap).` }); muat(); }
  }

  if (!data || !aturan) return <p className="text-sm text-slate-400">{msg?.text || "Memuat..."}</p>;
  const { komponen, peserta, totalBobot, adaSesi } = data;
  const aturanBerubah = Number(aturan.nilaiMinimal) !== data.aturan.nilaiMinimal || Number(aturan.kehadiranMinimal) !== data.aturan.kehadiranMinimal;
  const siap = totalBobot === 100 && peserta.length > 0;

  return (
    <div className="space-y-8">
      {msg && <p className={`rounded-md border-l-4 px-3 py-2 text-sm ${msg.ok ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-500 bg-rose-50 text-rose-700"}`}>{msg.text}</p>}

      {/* 1. Aturan + komponen */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-serif text-lg font-semibold text-navy">Syarat Kelulusan</h3>
          <p className="mb-4 text-xs text-slate-500">Peserta lulus bila nilai akhir <b>dan</b> kehadiran memenuhi batas ini.</p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-xs text-slate-500">Nilai akhir minimal<input type="number" min="0" max="100" className={`${inp} mt-1 block w-28`} value={aturan.nilaiMinimal} onChange={(e) => setAturan({ ...aturan, nilaiMinimal: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Kehadiran minimal (%)<input type="number" min="0" max="100" className={`${inp} mt-1 block w-28`} value={aturan.kehadiranMinimal} onChange={(e) => setAturan({ ...aturan, kehadiranMinimal: e.target.value })} /></label>
            <button disabled={!aturanBerubah} onClick={simpanAturan} className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Simpan</button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-navy">Komponen Penilaian</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${totalBobot === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>Total bobot {totalBobot}%</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">Isi nama dan bobot di form bawah, satu komponen per kali klik Tambah. Total bobot semua komponen harus tepat 100%.</p>
          <ul className="mb-3 space-y-1.5">
            {komponen.length === 0 && (
              <li className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                Belum ada komponen.
                <button type="button" onClick={pakaiTemplate} className="mt-2 block w-full font-medium text-navy underline">Pakai template: Pre-test 10% · Tugas 30% · Post-test 60%</button>
              </li>
            )}
            {komponen.map((k) => (
              <li key={k.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-800">{k.nama} <span className="text-slate-400">· {k.bobot}%</span></span>
                <button onClick={() => hapusKomponen(k)} aria-label="Hapus komponen" className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <form onSubmit={tambahKomponen} className="flex flex-wrap items-center gap-2">
            <input required maxLength={40} className={`${inp} min-w-[8rem] flex-1`} placeholder="Nama komponen" value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} />
            <input required type="number" min="1" max="100" className={`${inp} w-24`} placeholder="Bobot %" value={baru.bobot} onChange={(e) => setBaru({ ...baru, bobot: e.target.value })} />
            <button className="inline-flex items-center gap-1 rounded-md border border-navy px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"><Plus className="h-4 w-4" /> Tambah</button>
          </form>
        </section>
      </div>

      {/* 2. Tabel nilai */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-semibold text-navy">Nilai Peserta</h3>
            <p className="text-xs text-slate-500">Isi nilai 0–100; tersimpan otomatis saat kolom ditinggalkan. {adaSesi ? "Kehadiran dihitung dari tab Jadwal & Presensi." : "Belum ada sesi berlangsung, kehadiran belum dihitung."}</p>
          </div>
          <button onClick={siap ? terapkan : alasanBelumSiap} aria-disabled={!siap}
            className={`inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357] ${siap ? "" : "opacity-50"}`}>
            <Wand2 className="h-4 w-4" /> Terapkan ke Status Kelulusan
          </button>
        </div>

        {komponen.length > 0 && totalBobot !== 100 && (
          <p className="mb-3 rounded-md border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Total bobot masih <b>{totalBobot}%</b>. Tombol <b>Terapkan</b> aktif setelah total tepat 100% ({totalBobot < 100 ? `kurang ${100 - totalBobot}%` : `lebih ${totalBobot - 100}%`}).
            <button type="button" onClick={() => confirm("Hapus semua komponen & nilai yang ada, lalu pakai template Pre-test 10% · Tugas 30% · Post-test 60%?") && aturUlang()}
              className="ml-2 font-semibold underline">Atur ulang ke template</button>
          </p>
        )}
        {komponen.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Tambahkan komponen penilaian dulu untuk mulai mengisi nilai.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Peserta</th>
                  {komponen.map((k) => <th key={k.id} className="px-2 py-3 font-medium">{k.nama} <span className="text-slate-300">{k.bobot}%</span></th>)}
                  <th className="px-3 py-3 font-medium">Nilai Akhir</th>
                  <th className="px-3 py-3 font-medium">Kehadiran</th>
                  <th className="px-3 py-3 font-medium">Saran</th>
                  <th className="px-3 py-3 font-medium">Status Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {peserta.length === 0 && <tr><td colSpan={komponen.length + 5} className="px-4 py-8 text-center text-slate-400">Belum ada peserta di kelas ini.</td></tr>}
                {peserta.map((p) => {
                  const [sLabel, sCls] = SARAN[p.saran];
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.nama}</td>
                      {komponen.map((k) => (
                        <td key={k.id} className="px-2 py-2">
                          <input key={`${k.id}-${p.id}-${p.nilai[k.id] ?? ""}`} type="text" inputMode="decimal" defaultValue={p.nilai[k.id] ?? ""} placeholder="—"
                            onBlur={(e) => simpanNilai(k.id, p.id, e.target.value, p.nilai[k.id])}
                            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                            className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-center text-sm outline-none focus:border-navy" />
                        </td>
                      ))}
                      <td className="px-3 py-3 font-semibold text-navy">{p.nilaiAkhir ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-600">{p.kehadiran === null ? "—" : `${p.kehadiran}%`}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sCls}`}>{sLabel}</span></td>
                      <td className="px-3 py-3 text-xs text-slate-500">{STATUS[p.statusSekarang]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="mb-1 font-semibold text-slate-700">Cara membaca kolom Saran</p>
          <ul className="list-disc space-y-0.5 pl-4">
            <li><b>Lulus</b>: nilai akhir dan kehadiran sama-sama memenuhi syarat di atas.</li>
            <li><b>Tidak Lulus</b>: salah satunya (nilai atau kehadiran) di bawah syarat.</li>
            <li><b>Belum lengkap</b>: masih ada komponen nilai yang kosong; statusnya tidak diubah.</li>
          </ul>
          <p className="mt-2">Saran hanya usulan. Status peserta baru berubah setelah Anda menekan <b>Terapkan ke Status Kelulusan</b>. Untuk mengubah satu peserta saja, gunakan tombol <b>Edit</b> di tab <b>Peserta</b>.</p>
        </div>
      </section>
    </div>
  );
}
