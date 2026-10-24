"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, PlayCircle, Award, CalendarCheck, GraduationCap, Plus, UserPlus, Megaphone, FileBarChart, ArrowRight, AlertTriangle, Info, CheckCircle2, QrCode, Clock } from "lucide-react";

const tglPendek = (iso) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const lalu = (iso) => { const d = (Date.now() - new Date(iso).getTime()) / 3600000; return d < 1 ? "baru saja" : d < 24 ? `${Math.floor(d)} jam lalu` : `${Math.floor(d / 24)} hari lalu`; };

function useCountUp(target, ms = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const step = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Kpi({ label, nilai, sufiks = "", ikon: Icon, warna, sub, href }) {
  const v = useCountUp(nilai);
  const kartu = (
    <div className="group flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${warna}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none text-navy">{v}{sufiks}</p>
        <p className="mt-1.5 text-xs font-medium text-slate-600">{label}</p>
        {sub && <p className="mt-0.5 truncate text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{kartu}</Link> : kartu;
}

function Panel({ judul, aksi, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-serif text-lg font-semibold text-navy">{judul}</h2>{aksi}</div>
      {children}
    </section>
  );
}

// ---------- Grafik batang: pendaftaran vs kelas dimulai ----------
function GrafikBulanan({ perBulan }) {
  const [rentang, setRentang] = useState(6);
  const [hover, setHover] = useState(null);
  const data = rentang === 6 ? perBulan.slice(-6) : perBulan;
  const maks = Math.max(4, ...data.flatMap((b) => [b.pendaftaran, b.kelas]));
  const tinggi = (v) => `${(v / maks) * 100}%`;
  return (
    <Panel judul="Pendaftaran per Bulan" aksi={
      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
        {[6, 12].map((r) => <button key={r} onClick={() => { setRentang(r); setHover(null); }} className={`rounded-md px-3 py-1 font-medium transition ${rentang === r ? "bg-navy text-white" : "text-slate-500 hover:text-slate-800"}`}>{r} bulan</button>)}
      </div>}>
      <div className="mb-3 flex gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy" /> Pendaftaran peserta</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Kelas dimulai</span>
      </div>
      <div className="relative pl-7">
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="absolute left-0 right-0 flex items-center gap-2" style={{ bottom: `calc(1.6rem + ${f} * (100% - 1.6rem))`, transform: "translateY(50%)" }}>
            <span className="w-5 text-right text-[10px] text-slate-400">{Math.round(maks * f)}</span><span className="h-px flex-1 bg-slate-100" />
          </div>
        ))}
        <div className="relative flex h-52 items-stretch gap-1.5 sm:gap-2" onMouseLeave={() => setHover(null)}>
          {data.map((b, i) => (
            <div key={b.key} onMouseEnter={() => setHover(i)} className="relative flex flex-1 flex-col">
              {hover === i && (
                <div className="absolute bottom-full left-1/2 z-10 mb-1 w-32 -translate-x-1/2 rounded-lg bg-navy px-3 py-2 text-xs text-white shadow-lg">
                  <p className="font-semibold">{b.label} {b.tahun}</p>
                  <p className="mt-0.5 text-white/80">{b.pendaftaran} pendaftaran</p><p className="text-white/80">{b.kelas} kelas dimulai</p>
                </div>
              )}
              <div className={`flex flex-1 items-end justify-center gap-0.5 rounded-t-md transition ${hover === i ? "bg-slate-50" : ""}`}>
                <div className="w-1/2 max-w-[1.25rem] rounded-t bg-navy transition-all duration-500" style={{ height: tinggi(b.pendaftaran), minHeight: b.pendaftaran ? 4 : 0 }} />
                <div className="w-1/2 max-w-[1.25rem] rounded-t bg-gold transition-all duration-500" style={{ height: tinggi(b.kelas), minHeight: b.kelas ? 4 : 0 }} />
              </div>
              <span className={`mt-1 h-5 text-center text-[11px] ${hover === i ? "font-semibold text-navy" : "text-slate-400"}`}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ---------- Donut status kelulusan ----------
const SEG = [["LULUS", "Lulus", "#10b981"], ["PROSES", "Proses", "#f59e0b"], ["TIDAK_LULUS", "Tidak Lulus", "#f43f5e"]];
function DonutStatus({ status }) {
  const [hover, setHover] = useState(null);
  const r = 40, c = 2 * Math.PI * r;
  let offset = 0;
  const aktif = hover ? SEG.find((s) => s[0] === hover) : null;
  const pusat = aktif ? { besar: status[aktif[0]], kecil: aktif[1] } : { besar: `${status.total ? Math.round((status.LULUS / status.total) * 100) : 0}%`, kecil: "lulus" };
  return (
    <Panel judul="Status Kelulusan">
      <div className="flex items-center gap-5">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            {status.total > 0 && SEG.map(([k, , warna]) => {
              const len = (status[k] / status.total) * c;
              const el = <circle key={k} cx="50" cy="50" r={r} fill="none" stroke={warna} strokeWidth={hover === k ? 14 : 10} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} className="cursor-pointer transition-all duration-200" />;
              offset += len;
              return el;
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold text-navy">{pusat.besar}</span><span className="text-[11px] text-slate-500">{pusat.kecil}</span></div>
        </div>
        <ul className="flex-1 space-y-2 text-sm">
          {SEG.map(([k, label, warna]) => (
            <li key={k} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} className={`flex cursor-default items-center justify-between rounded-md px-2 py-1 transition ${hover === k ? "bg-slate-50" : ""}`}>
              <span className="inline-flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: warna }} />{label}</span><b className="text-slate-800">{status[k]}</b>
            </li>
          ))}
        </ul>
      </div>
      {status.total === 0 && <p className="mt-3 text-center text-xs text-slate-400">Belum ada peserta terdaftar di kelas.</p>}
    </Panel>
  );
}

const STATUS_KELAS = { BERJALAN: ["Berjalan", "bg-emerald-50 text-emerald-700", "bg-emerald-500"], PERSIAPAN: ["Persiapan", "bg-amber-50 text-amber-700", "bg-amber-500"], SELESAI: ["Selesai", "bg-slate-100 text-slate-600", "bg-slate-400"] };

export default function DashboardAdmin({ nama, data }) {
  const [sapa, setSapa] = useState("Halo");
  const [tgl, setTgl] = useState("");
  const [tab, setTab] = useState("SEMUA");
  useEffect(() => {
    const j = new Date().getHours();
    setSapa(j < 11 ? "Selamat pagi" : j < 15 ? "Selamat siang" : j < 18 ? "Selamat sore" : "Selamat malam");
    setTgl(new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const { kpi, status, perBulan, perhatian, sesiHariIni, kelas, pengumuman } = data;
  const aksiCepat = [["/kelas/baru", "Buat Kelas", Plus], ["/peserta", "Tambah Peserta", UserPlus], ["/pengumuman", "Pengumuman", Megaphone], ["/laporan", "Laporan", FileBarChart]];
  const tabs = [["SEMUA", "Semua"], ["BERJALAN", "Berjalan"], ["PERSIAPAN", "Persiapan"], ["SELESAI", "Selesai"]];
  const hitung = (t) => (t === "SEMUA" ? kelas.length : kelas.filter((k) => k.status === t).length);
  const kelasTampil = (tab === "SEMUA" ? kelas : kelas.filter((k) => k.status === tab)).slice(0, 9);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{tgl || "\u00A0"}</p>
          <h1 className="font-serif text-2xl font-semibold text-navy sm:text-3xl">{sapa}, {String(nama).split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan penyelenggaraan diklat dan hal yang perlu Anda perhatikan hari ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {aksiCepat.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-navy shadow-sm transition hover:border-navy hover:bg-slate-50"><Icon className="h-4 w-4" />{label}</Link>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Diklat Aktif" nilai={kpi.diklatAktif} ikon={GraduationCap} warna="bg-sky-50 text-sky-600" href="/diklat" />
        <Kpi label="Total Peserta" nilai={kpi.totalPeserta} ikon={Users} warna="bg-violet-50 text-violet-600" href="/peserta" />
        <Kpi label="Kelas Berjalan" nilai={kpi.kelasBerjalan} ikon={PlayCircle} warna="bg-emerald-50 text-emerald-600" href="/kelas" />
        <Kpi label="Kelulusan" nilai={kpi.persenLulus} sufiks="%" ikon={Award} warna="bg-amber-50 text-amber-600" sub={`${status.LULUS} dari ${status.total} pendaftaran`} />
        <Kpi label="Sertifikat Terbit" nilai={kpi.sertifikat} ikon={BookOpen} warna="bg-rose-50 text-rose-600" />
        <Kpi label="Sesi Hari Ini" nilai={kpi.sesiHariIni} ikon={CalendarCheck} warna="bg-indigo-50 text-indigo-600" />
      </div>

      {/* Sesi hari ini + perlu tindakan */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel judul="Sesi Hari Ini" className="lg:col-span-2">
          {sesiHariIni.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><CalendarCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm text-slate-500">Tidak ada sesi terjadwal hari ini.</p></div>
          ) : (
            <ul className="space-y-2.5">
              {sesiHariIni.map((s) => {
                const pct = s.total ? Math.round((s.hadir / s.total) * 100) : 0;
                return (
                  <li key={s.id}>
                    <Link href={`/kelas/${s.kelasId}`} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3.5 transition hover:border-navy hover:bg-slate-50/60">
                      <div className="w-24 shrink-0 text-center"><p className="inline-flex items-center gap-1 text-sm font-semibold text-navy"><Clock className="h-3.5 w-3.5 text-gold" />{s.jamMulai}</p><p className="text-[11px] text-slate-400">s/d {s.jamSelesai} WIB</p></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{s.judul}</p><p className="truncate text-xs text-slate-500">{s.kelas}</p></div>
                      <div className="w-36 shrink-0">
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Hadir</span><b className="text-slate-700">{s.hadir}/{s.total}</b></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                      </div>
                      {s.absenDibuka && <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"><QrCode className="h-3.5 w-3.5" />Absen dibuka</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel judul="Perlu Tindakan" aksi={perhatian.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{perhatian.length}</span>}>
          {perhatian.length === 0 ? (
            <div className="py-6 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" /><p className="mt-2 text-sm font-medium text-slate-700">Semua beres</p><p className="text-xs text-slate-400">Tidak ada yang perlu ditindaklanjuti.</p></div>
          ) : (
            <ul className="space-y-2">
              {perhatian.map((p) => (
                <li key={p.id}>
                  <Link href={p.href} className="group flex items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-navy hover:bg-slate-50/60">
                    {p.tingkat === "warn" ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />}
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{p.judul}</p><p className="text-xs text-slate-500">{p.detail}</p></div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-navy">{p.jumlah}<ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-navy" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Grafik */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><GrafikBulanan perBulan={perBulan} /></div>
        <DonutStatus status={status} />
      </div>

      {/* Kelas */}
      <Panel className="mt-6" judul="Kelas Diklat" aksi={<Link href="/kelas" className="text-sm font-medium text-navy hover:underline">Lihat semua →</Link>}>
        <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 [&>*]:shrink-0">
          {tabs.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${tab === k ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {label}<span className={`rounded-full px-1.5 text-[11px] ${tab === k ? "bg-navy text-white" : "bg-slate-100 text-slate-500"}`}>{hitung(k)}</span>
            </button>
          ))}
        </div>
        {kelasTampil.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">{kelas.length === 0 ? <>Belum ada Kelas Diklat. <Link href="/kelas/baru" className="underline">Buat yang pertama →</Link></> : "Tidak ada kelas pada status ini."}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {kelasTampil.map((k) => {
              const [label, badge, titik] = STATUS_KELAS[k.status] || STATUS_KELAS.PERSIAPAN;
              const isi = k.kuota ? Math.min(100, Math.round((k.peserta / k.kuota) * 100)) : 0;
              return (
                <Link key={k.id} href={`/kelas/${k.id}`} className="group block rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-navy hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k.kode}</p><p className="truncate font-medium text-slate-800">{k.nama}</p><p className="text-xs text-slate-500">{k.batch}</p></div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}><span className={`h-1.5 w-1.5 rounded-full ${titik}`} />{label}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500"><span>Waktu pelaksanaan</span><span>{tglPendek(k.mulai)} – {tglPendek(k.selesai)}</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-navy transition-all duration-700" style={{ width: `${k.progresWaktu}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500"><span>Peserta</span><span><b className="text-slate-700">{k.peserta}</b>/{k.kuota} · {k.lulus} lulus</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${isi}%` }} /></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Pengumuman terakhir */}
      {pengumuman && (
        <Link href="/pengumuman" className="mt-6 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-navy">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Megaphone className="h-5 w-5" /></span>
          <div className="min-w-0"><p className="text-xs text-slate-400">Pengumuman terakhir · {lalu(pengumuman.createdAt)}</p><p className="font-medium text-navy">{pengumuman.judul}</p><p className="line-clamp-2 text-sm text-slate-500">{pengumuman.isi}</p></div>
        </Link>
      )}
    </div>
  );
}
