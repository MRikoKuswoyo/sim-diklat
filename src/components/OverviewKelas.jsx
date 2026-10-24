"use client";

import { Users, Award, BarChart3, CalendarCheck, CheckCircle2, Circle, ArrowRight, FileSpreadsheet } from "lucide-react";
import MoodleKelasCard from "@/components/MoodleKelasCard";

const STATUS_SEG = [["LULUS", "Lulus", "bg-emerald-500"], ["PROSES", "Proses", "bg-amber-500"], ["TIDAK_LULUS", "Tidak Lulus", "bg-rose-500"]];

function Stat({ ikon: Icon, warna, label, nilai, sub, bar }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${warna}`}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="text-2xl font-semibold leading-none text-navy">{nilai}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>
      </div>
      {bar !== undefined && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${bar}%` }} /></div>}
      {sub && <p className="mt-2 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

export default function OverviewKelas({ kelas, ekstra, totalJp, onPindahTab }) {
  const peserta = kelas.peserta;
  const total = peserta.length;
  const jumlah = Object.fromEntries(STATUS_SEG.map(([k]) => [k, peserta.filter((p) => p.statusKelulusan === k).length]));
  const persenLulus = total ? Math.round((jumlah.LULUS / total) * 100) : 0;
  const nilaiAda = peserta.map((p) => (p.nilai === null || p.nilai === undefined ? null : Number(p.nilai))).filter((n) => n !== null && !Number.isNaN(n));
  const rataNilai = nilaiAda.length ? Math.round((nilaiAda.reduce((a, b) => a + b, 0) / nilaiAda.length) * 10) / 10 : null;
  const lulus = peserta.filter((p) => p.statusKelulusan === "LULUS");
  const isiKuota = kelas.kuota ? Math.min(100, Math.round((total / kelas.kuota) * 100)) : 0;

  // Daftar kesiapan kelas; setiap butir yang belum lengkap mengarah ke tab terkait
  const butir = [
    { id: "materi", ok: kelas.materi.length > 0, label: "Materi diklat tersedia", detail: `${kelas.materi.length} materi · ${totalJp} JP`, hint: "Tambahkan materi di menu Materi Diklat.", tab: "materi" },
    { id: "narasumber", ok: kelas.materi.length > 0 && kelas.materi.every((m) => m.narasumber.length > 0), label: "Narasumber ditugaskan di semua materi", detail: `${kelas.materi.filter((m) => m.narasumber.length > 0).length} dari ${kelas.materi.length} materi`, hint: "Tugaskan narasumber pada tiap materi.", tab: "materi" },
    { id: "panitia", ok: kelas.panitia.length > 0, label: "Panitia ditugaskan", detail: `${kelas.panitia.length} orang`, hint: "Pilih panitia dan penanggung jawab kelas.", tab: "panitia" },
    { id: "peserta", ok: total > 0, label: "Peserta terdaftar", detail: `${total} dari ${kelas.kuota} kuota`, hint: "Tambah atau impor peserta.", tab: "peserta" },
    { id: "sesi", ok: ekstra.sesiTotal > 0, label: "Jadwal sesi dibuat", detail: `${ekstra.sesiTotal} sesi`, hint: "Buat sesi agar presensi dan kalender peserta terisi.", tab: "jadwal" },
    { id: "nilai", ok: ekstra.komponen > 0, label: "Komponen penilaian diatur", detail: `${ekstra.komponen} komponen`, hint: "Atur bobot nilai agar kelulusan bisa dihitung.", tab: "nilai" },
    ...(lulus.length ? [{ id: "sertifikat", ok: lulus.every((p) => p.sertifikatUrl), label: "Sertifikat peserta lulus diunggah", detail: `${lulus.filter((p) => p.sertifikatUrl).length} dari ${lulus.length} lulus`, hint: "Unggah PDF sertifikat di tab Peserta.", tab: "peserta" }] : []),
  ];
  const selesai = butir.filter((b) => b.ok).length;
  const persenSiap = Math.round((selesai / butir.length) * 100);
  const r = 34, c = 2 * Math.PI * r;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat ikon={Users} warna="bg-violet-50 text-violet-600" label="Peserta terisi" nilai={`${total}/${kelas.kuota}`} bar={isiKuota} sub={`Sisa ${Math.max(0, kelas.kuota - total)} kursi`} />
        <Stat ikon={Award} warna="bg-emerald-50 text-emerald-600" label="Dinyatakan lulus" nilai={`${persenLulus}%`} sub={`${jumlah.LULUS} dari ${total} peserta`} />
        <Stat ikon={BarChart3} warna="bg-amber-50 text-amber-600" label="Rata-rata nilai akhir" nilai={rataNilai ?? "—"} sub={rataNilai === null ? "Belum ada nilai" : `${nilaiAda.length} peserta bernilai`} />
        <Stat ikon={CalendarCheck} warna="bg-sky-50 text-sky-600" label="Sesi terlaksana" nilai={`${ekstra.sesiLalu}/${ekstra.sesiTotal}`} bar={ekstra.sesiTotal ? Math.round((ekstra.sesiLalu / ekstra.sesiTotal) * 100) : 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kesiapan kelas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="40" cy="40" r={r} fill="none" stroke={persenSiap === 100 ? "#10b981" : "#B8892B"} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * persenSiap) / 100} className="transition-all duration-700" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-navy">{persenSiap}%</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-navy">Kesiapan Kelas</h2>
              <p className="text-sm text-slate-500">{persenSiap === 100 ? "Semua persiapan sudah lengkap." : `${selesai} dari ${butir.length} langkah selesai. Klik langkah yang belum lengkap untuk melengkapinya.`}</p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {butir.map((b) => (
              <li key={b.id}>
                <button onClick={() => onPindahTab(b.tab)} className="group flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50/70">
                  {b.ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="h-5 w-5 shrink-0 text-slate-300" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${b.ok ? "text-slate-700" : "font-medium text-slate-900"}`}>{b.label}</span>
                    <span className="block text-xs text-slate-400">{b.ok ? b.detail : b.hint}</span>
                  </span>
                  {!b.ok && <span className="inline-flex items-center gap-1 text-xs font-medium text-navy">Lengkapi <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-serif text-base font-semibold text-navy">Status Kelulusan</h3>
            {total === 0 ? <p className="mt-3 text-sm text-slate-400">Belum ada peserta.</p> : (
              <>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
                  {STATUS_SEG.map(([k, , warna]) => jumlah[k] > 0 && <div key={k} className={`${warna} transition-all duration-700`} style={{ width: `${(jumlah[k] / total) * 100}%` }} title={`${k}: ${jumlah[k]}`} />)}
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {STATUS_SEG.map(([k, label, warna]) => <li key={k} className="flex items-center justify-between text-slate-600"><span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${warna}`} />{label}</span><b className="text-slate-800">{jumlah[k]}</b></li>)}
                </ul>
              </>
            )}
          </section>

          <MoodleKelasCard kelasId={kelas.id} awal={ekstra.moodleCourseId} moodleUrl={ekstra.moodleUrl} />

          <a href={`/api/kelas/${kelas.id}/laporan`} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-navy hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-800">Unduh laporan kelas</span><span className="block text-xs text-slate-400">Excel: ringkasan, peserta, presensi, nilai</span></span>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-navy" />
          </a>
        </aside>
      </div>
    </div>
  );
}
