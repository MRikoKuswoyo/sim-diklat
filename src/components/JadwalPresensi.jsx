"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, CheckCheck, Maximize2 } from "lucide-react";
import QrPopup from "@/components/QrPopup";

const OPSI = [
  ["HADIR", "H", "Hadir", "bg-emerald-600 text-white border-emerald-600"],
  ["IZIN", "I", "Izin", "bg-sky-600 text-white border-sky-600"],
  ["SAKIT", "S", "Sakit", "bg-amber-500 text-white border-amber-500"],
  ["ALPA", "A", "Alpa", "bg-rose-600 text-white border-rose-600"],
];
const fmt = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const inp = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-navy";

export default function JadwalPresensi({ kelasId }) {
  const base = `/api/kelas/${kelasId}/sesi`;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [buka, setBuka] = useState(null);
  const [qrSesiId, setQrSesiId] = useState(null);
  const [form, setForm] = useState(null);
  const hariIni = new Date().toLocaleDateString("sv-SE");

  const muat = useCallback(async () => {
    const res = await fetch(base);
    if (!res.ok) return setError("Gagal memuat jadwal.");
    setData(await res.json());
  }, [base]);
  useEffect(() => { muat(); }, [muat]);

  async function tambah(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json().catch(() => null);
    if (!res.ok) return setError(d?.error || "Gagal menambah sesi.");
    setForm(null);
    muat();
  }

  async function hapus(s) {
    if (!confirm(`Hapus sesi "${s.judul}" (${fmt(s.tanggal)}) beserta presensinya?`)) return;
    await fetch(`${base}?sesiId=${s.id}`, { method: "DELETE" });
    muat();
  }

  // Simpan presensi; tampilan diperbarui langsung (optimistic)
  async function set(sesiId, pesertaId, status) {
    setData((d) => ({ ...d, sesi: d.sesi.map((s) => {
      if (s.id !== sesiId) return s;
      const presensi = { ...s.presensi };
      if (status === null) delete presensi[pesertaId]; else presensi[pesertaId] = status;
      return { ...s, presensi };
    }) }));
    const res = await fetch(base, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sesiId, pesertaId, status }) });
    if (!res.ok) { setError("Gagal menyimpan presensi."); muat(); }
  }

  async function aksiAbsen(sesiId, aksi) {
    const res = await fetch(`${base}/absen`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sesiId, aksi }) });
    if (!res.ok) setError("Gagal mengubah status absen.");
    muat();
  }

  async function semuaHadir(sesiId) {
    await fetch(base, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sesiId, semua: "HADIR" }) });
    muat();
  }

  if (!data) return <p className="text-sm text-slate-400">{error || "Memuat..."}</p>;
  const { sesi, peserta } = data;
  const qrSesi = sesi.find((x) => x.id === qrSesiId);
  const MIN_HADIR = data.kehadiranMinimal ?? 80; // diatur di tab Nilai & Kelulusan
  const terlaksana = sesi.filter((s) => s.tanggal <= hariIni);

  return (
    <div className="space-y-8">
      {qrSesi?.kodeAbsen && (
        <QrPopup
          judul="Scan untuk Absen"
          subjudul={`${fmt(qrSesi.tanggal)} · ${qrSesi.jamMulai}–${qrSesi.jamSelesai} WIB — ${qrSesi.judul}`}
          src={`${base}/absen/qr?sesiId=${qrSesi.id}&k=${qrSesi.kodeAbsen}`}
          kode={qrSesi.kodeAbsen}
          catatan="Peserta memindai dengan kamera HP, login jika diminta, lalu kehadiran tercatat otomatis."
          unduhHref={`${base}/absen/qr?sesiId=${qrSesi.id}&k=${qrSesi.kodeAbsen}`}
          unduhNama={`QR-absen-${qrSesi.kodeAbsen}.png`}
          onClose={() => setQrSesiId(null)}
        />
      )}
      {/* Daftar sesi */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-navy">Jadwal Sesi ({sesi.length})</h3>
          {!form && (
            <button onClick={() => setForm({ tanggal: hariIni, jamMulai: "08:00", jamSelesai: "10:00", judul: "" })}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-[#223357]">
              <Plus className="h-4 w-4" /> Tambah Sesi
            </button>
          )}
        </div>

        {form && (
          <form onSubmit={tambah} className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-xs text-slate-500">Tanggal<input required type="date" className={`${inp} mt-1 block`} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Mulai<input required type="time" className={`${inp} mt-1 block`} value={form.jamMulai} onChange={(e) => setForm({ ...form, jamMulai: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Selesai<input required type="time" className={`${inp} mt-1 block`} value={form.jamSelesai} onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })} /></label>
            <label className="min-w-[14rem] flex-1 text-xs text-slate-500">Judul / materi sesi<input required className={`${inp} mt-1 block w-full`} placeholder="mis. Pengenalan HTML & CSS" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></label>
            <button className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white">Simpan</button>
            <button type="button" onClick={() => setForm(null)} className="px-2 py-2 text-sm text-slate-500">Batal</button>
          </form>
        )}
        {error && <p className="mb-3 rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {sesi.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Belum ada sesi. Klik "Tambah Sesi" untuk membuat jadwal pertemuan.</p>}

        <div className="space-y-2">
          {sesi.map((s) => {
            const hadir = peserta.filter((p) => s.presensi[p.id] === "HADIR").length;
            const terbuka = buka === s.id;
            return (
              <div key={s.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <div className="w-36 shrink-0"><p className="text-sm font-semibold text-navy">{fmt(s.tanggal)}</p><p className="text-xs text-slate-500">{s.jamMulai}–{s.jamSelesai} WIB</p></div>
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{s.judul}</p>
                  {s.kodeAbsen && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">Absen dibuka</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.tanggal > hariIni ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                    {s.tanggal > hariIni ? "Akan datang" : `Hadir ${hadir}/${peserta.length}`}
                  </span>
                  <button onClick={() => setBuka(terbuka ? null : s.id)} className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
                    Presensi <ChevronDown className={`h-4 w-4 transition ${terbuka ? "rotate-180" : ""}`} />
                  </button>
                  <button onClick={() => hapus(s)} aria-label="Hapus sesi" className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>

                {terbuka && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-navy">Absen Mandiri</p>
                          <p className="text-xs text-slate-500">Peserta absen sendiri dengan kode atau QR, mulai 15 menit sebelum sampai 30 menit setelah sesi.</p>
                        </div>
                        {s.kodeAbsen
                          ? <button onClick={() => aksiAbsen(s.id, "tutup")} className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">Tutup Absen</button>
                          : <button onClick={() => aksiAbsen(s.id, "buka")} className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-[#223357]">Buka Absen</button>}
                      </div>
                      {s.kodeAbsen && (
                        <div className="mt-4 flex flex-wrap items-center gap-6">
                          <button type="button" onClick={() => setQrSesiId(s.id)} title="Klik untuk memperbesar" className="group relative rounded-lg">
                            <img src={`${base}/absen/qr?sesiId=${s.id}&k=${s.kodeAbsen}`} alt="QR absen" className="h-40 w-40 rounded-lg border border-slate-200 transition group-hover:border-navy group-hover:shadow-md" />
                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-navy/70 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                              <Maximize2 className="h-5 w-5" /> Perbesar QR
                            </span>
                          </button>
                          <div>
                            <p className="text-xs text-slate-500">Atau ketik kode ini di Portal:</p>
                            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em] text-navy">{s.kodeAbsen}</p>
                            <p className="mt-2 text-xs text-slate-400">Klik QR untuk memperbesarnya di layar kelas. Tutup absen bila sudah selesai.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {peserta.length === 0 ? <p className="text-sm text-slate-400">Belum ada peserta di kelas ini.</p> : (
                      <>
                        <button onClick={() => semuaHadir(s.id)} className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                          <CheckCheck className="h-4 w-4" /> Tandai semua hadir
                        </button>
                        <ul className="divide-y divide-slate-100">
                          {peserta.map((p) => (
                            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                              <span className="text-sm text-slate-800">{p.nama}</span>
                              <div className="flex gap-1">
                                {OPSI.map(([kode, huruf, label, aktif]) => (
                                  <button key={kode} title={label} onClick={() => set(s.id, p.id, s.presensi[p.id] === kode ? null : kode)}
                                    className={`h-8 w-8 rounded-md border text-xs font-semibold transition ${s.presensi[p.id] === kode ? aktif : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"}`}>{huruf}</button>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-slate-400">H = Hadir · I = Izin · S = Sakit · A = Alpa. Klik lagi untuk mengosongkan.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Rekap kehadiran */}
      {peserta.length > 0 && (
        <section>
          <h3 className="mb-1 font-serif text-lg font-semibold text-navy">Rekap Kehadiran</h3>
          <p className="mb-3 text-xs text-slate-500">Dihitung dari {terlaksana.length} sesi yang sudah berlangsung. Hanya status Hadir yang dihitung; batas minimal {MIN_HADIR}%.</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="px-4 py-3 font-medium">Peserta</th><th className="px-4 py-3 font-medium">H / I / S / A</th><th className="px-4 py-3 font-medium">Kehadiran</th><th className="px-4 py-3 font-medium">Keterangan</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {peserta.map((p) => {
                  const hit = (k) => terlaksana.filter((s) => s.presensi[p.id] === k).length;
                  const persen = terlaksana.length ? Math.round((hit("HADIR") / terlaksana.length) * 100) : null;
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.nama}</td>
                      <td className="px-4 py-3 text-slate-600">{hit("HADIR")} / {hit("IZIN")} / {hit("SAKIT")} / {hit("ALPA")}</td>
                      <td className="px-4 py-3">
                        {persen === null ? <span className="text-slate-300">—</span> : (
                          <div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${persen >= MIN_HADIR ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${persen}%` }} /></div><span className="text-xs font-medium text-slate-700">{persen}%</span></div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {persen === null ? null : <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${persen >= MIN_HADIR ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{persen >= MIN_HADIR ? "Memenuhi syarat" : `Di bawah ${MIN_HADIR}%`}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
