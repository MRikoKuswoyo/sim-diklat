import { syncStatusKelas } from "@/lib/kelasStatus";
import AbsenKode from "@/components/AbsenKode";
import ScanQrAbsen from "@/components/ScanQrAbsen";
import { buatPengingat } from "@/lib/notifikasi";
import Link from "next/link";
import { cookies } from "next/headers";
import { Search, BookOpen, CalendarDays, Award, Bell, MapPin, Clock, Download, FileText } from "lucide-react";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const DAY = 86400000;
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const sehari = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

function Ring({ persen }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#2F6F8F" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * persen) / 100} />
    </svg>
  );
}

function Kartu({ icon: Icon, judul, children, tombol, href }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-navy"><Icon className="h-5 w-5" /></span>
        <h3 className="font-serif text-lg font-semibold text-navy">{judul}</h3>
      </div>
      <div className="flex-1">{children}</div>
      <Link href={href} className="mt-4 block rounded-md bg-navy py-2 text-center text-sm font-medium text-white hover:bg-[#223357]">{tombol}</Link>
    </div>
  );
}

function Kalender({ kelasList, sesiHari }) {
  const now = new Date();
  const awal = new Date(now.getFullYear(), now.getMonth(), 1);
  const jumlah = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const hariIni = sehari(now);
  const sel = [...Array(awal.getDay()).fill(null), ...Array.from({ length: jumlah }, (_, i) => i + 1)];
  const adaKelas = (tgl) => {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(tgl).padStart(2, "0")}`;
    if (sesiHari.has(key)) return true;
    const t = sehari(new Date(now.getFullYear(), now.getMonth(), tgl));
    return kelasList.some((k) => sehari(k.tanggalMulai) <= t && sehari(k.tanggalSelesai) >= t);
  };
  return (
    <div>
      <p className="mb-2 text-center text-xs font-medium text-slate-500">
        {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {HARI.map((h) => <span key={h} className="text-slate-400">{h}</span>)}
        {sel.map((tgl, i) => {
          if (!tgl) return <span key={i} />;
          const t = sehari(new Date(now.getFullYear(), now.getMonth(), tgl));
          const hariIniCell = t === hariIni;
          return (
            <span key={i} className={`mx-auto flex h-6 w-6 flex-col items-center justify-center rounded-md ${hariIniCell ? "bg-navy font-semibold text-white" : "text-slate-600"}`}>
              {tgl}
              {adaKelas(tgl) && <span className={`-mt-0.5 h-1 w-1 rounded-full ${hariIniCell ? "bg-white" : "bg-sky-600"}`} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Ilustrasi() {
  return (
    <svg viewBox="0 0 220 170" className="h-40 w-auto" aria-hidden="true">
      <rect x="55" y="15" width="110" height="80" rx="8" fill="#16233F" />
      <text x="110" y="62" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="serif">SIM Diklat</text>
      <rect x="95" y="95" width="30" height="8" fill="#CBD5E1" />
      {[[35, "#2F6F8F"], [75, "#B8892B"], [115, "#16233F"], [155, "#7BA9BF"], [190, "#B8892B"]].map(([x, c], i) => (
        <g key={i}>
          <circle cx={x} cy={120 + (i % 2) * 4} r="9" fill="#F1C9A5" />
          <rect x={x - 12} y={131 + (i % 2) * 4} width="24" height="34" rx="10" fill={c} />
        </g>
      ))}
    </svg>
  );
}

const STATUS_STYLES = {
  LULUS: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-600", label: "Lulus" },
  PROSES: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-600", label: "Proses" },
  TIDAK_LULUS: { bg: "bg-rose-50", text: "text-rose-800", dot: "bg-rose-600", label: "Tidak Lulus" },
};

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PROSES;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatTanggal(date) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function PortalPage() {
  await syncStatusKelas();
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session?.pesertaId) {
    return (
      <div>
        <h1 className="mb-3 font-serif text-2xl font-semibold text-navy">Portal Peserta</h1>
        <p className="text-sm text-slate-500">
          Akun ini belum terhubung ke data Peserta manapun, jadi belum ada kelas untuk ditampilkan.
        </p>
      </div>
    );
  }

  const pendaftaran = await prisma.pendaftaranPeserta.findMany({
    where: { pesertaId: session.pesertaId },
    include: { kelas: { include: { judulDiklat: { include: { materi: true } } } } },
    orderBy: { kelas: { tanggalMulai: "desc" } },
  });

  const info = await prisma.pengumuman.findFirst({ orderBy: { createdAt: "desc" } });
  const sekarang = Date.now();
  const kelasList = pendaftaran.map((pd) => pd.kelas);
  const sesiAll = await prisma.sesiKelas.findMany({
    where: { kelasId: { in: kelasList.map((k) => k.id) } },
    include: { presensi: { where: { pesertaId: session.pesertaId } } },
    orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }],
  });
  const hariIniKey = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const tglKey = (s) => s.tanggal.toISOString().slice(0, 10);
  const sesi7 = sesiAll.filter((s) => tglKey(s) >= hariIniKey && (new Date(tglKey(s)) - new Date(hariIniKey)) / DAY <= 7);
  const kelasAdaSesi = new Set(sesiAll.map((s) => s.kelasId));
  const besokKey = new Date(Date.now() + DAY).toLocaleDateString("sv-SE");
  for (const s of sesiAll.filter((x) => tglKey(x) === besokKey)) await buatPengingat(session.sub, s);
  const berakhir = (k) => sehari(k.tanggalSelesai) + DAY <= sekarang;
  const aktif = kelasList.filter((k) => !berakhir(k) && sehari(k.tanggalMulai) <= sekarang);
  const progress = kelasList.length ? Math.round((kelasList.filter(berakhir).length / kelasList.length) * 100) : 0;
  const lulus = pendaftaran.filter((pd) => pd.statusKelulusan === "LULUS").length;
  const mendatang = kelasList.filter((k) => sehari(k.tanggalMulai) > sekarang).sort((x, y) => x.tanggalMulai - y.tanggalMulai);
  const dalam7Hari = mendatang.filter((k) => sehari(k.tanggalMulai) - sehari(sekarang) <= 7 * DAY);
  const pengumuman = aktif[0]
    ? `Kelas "${aktif[0].judulDiklat.nama}" sedang berlangsung sampai ${formatTanggal(aktif[0].tanggalSelesai)}.`
    : mendatang[0]
    ? `Kelas "${mendatang[0].judulDiklat.nama}" dimulai ${formatTanggal(mendatang[0].tanggalMulai)}.`
    : "Belum ada pengumuman baru.";
  const namaDepan = String(session.nama || "").split(" ")[0];

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-semibold text-navy">Portal Peserta</h1>
      <p className="mb-6 text-sm text-slate-500">Halo, {session.nama}. Berikut kelas diklat yang kamu ikuti.</p>

      {/* Hero */}
      <div className="mb-6 grid items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[auto,1fr,18rem]">
        <div className="mx-auto"><Ilustrasi /></div>
        <div>
          <h2 className="font-serif text-2xl font-semibold text-navy">Selamat Datang di Portal SIM Diklat, {namaDepan}!</h2>
          <p className="mt-2 max-w-lg text-sm text-slate-600">
            Siap untuk memulai perjalanan belajar Anda? Jelajahi materi, kelola jadwal Anda, dan lacak kemajuan Anda di sini.
          </p>
          <Link href="/portal/materi" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-700/30 hover:bg-sky-800">
            Jelajahi Katalog Pelatihan <Search className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-md">
          <div className="flex items-center justify-between bg-gradient-to-r from-navy to-sky-700 px-4 py-2 text-xs font-semibold tracking-wide text-white">
            LIVE UPDATES <Bell className="h-4 w-4" />
          </div>
          <div className="bg-white/80 p-4 text-sm text-slate-700">
            {info ? (<><p className="font-semibold text-navy">{info.judul}</p><p className="mt-1 line-clamp-4">{info.isi}</p></>) : <p>{pengumuman}</p>}
          </div>
        </div>
      </div>

      {/* Absen sesi hari ini */}
      {(() => {
        const hariIni = sesiAll.filter((s) => tglKey(s) === hariIniKey);
        if (!hariIni.length) return null;
        const adaBelum = hariIni.some((s) => s.presensi[0]?.status !== "HADIR");
        return (
          <div className="mb-6 rounded-xl border border-gold/40 bg-amber-50/50 p-5 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-navy">Sesi Hari Ini</h2>
            <ul className="mt-2 space-y-1.5">
              {hariIni.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700"><b>{s.jamMulai}–{s.jamSelesai}</b> · {s.judul}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.presensi[0]?.status === "HADIR" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.presensi[0]?.status === "HADIR" ? "Sudah absen ✓" : "Belum absen"}
                  </span>
                </li>
              ))}
            </ul>
            {adaBelum && (
              <>
                <p className="mt-3 text-xs text-slate-500">Pindai QR di layar kelas, atau masukkan kode dari pengajar.</p>
                <div className="mt-3"><ScanQrAbsen /></div>
                <p className="mt-4 text-xs text-slate-400">Atau ketik kode secara manual:</p>
                <AbsenKode />
              </>
            )}
          </div>
        );
      })()}

      {/* Aktivitas Saya */}
      <h2 className="mb-3 font-serif text-xl font-semibold text-navy">Aktivitas Saya</h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Kartu icon={BookOpen} judul="Kelas Saya" tombol="Lihat Kelas" href="#kelas-saya">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Ring persen={progress} />
              <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-semibold text-navy">{aktif.length}</span>
                <span className="text-[10px] text-slate-500">Kelas Aktif</span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Terbaru diikuti</p>
              <ul className="mt-1 max-h-20 space-y-1 overflow-y-auto text-xs text-sky-800">
                {kelasList.length === 0 && <li className="text-slate-400">Belum ada kelas</li>}
                {kelasList.slice(0, 5).map((k) => <li key={k.id} className="truncate">• {k.judulDiklat.nama}</li>)}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Progres keseluruhan: {progress}%</p>
        </Kartu>

        <Kartu icon={CalendarDays} judul="Jadwal Mendatang" tombol="Lihat Jadwal" href="#kelas-saya">
          <Kalender kelasList={kelasList.filter((k) => !kelasAdaSesi.has(k.id))} sesiHari={new Set(sesiAll.map(tglKey))} />
          <p className="mt-3 text-center text-xs text-slate-500">
            {sesi7.length
              ? `Sesi berikutnya: ${formatTanggal(sesi7[0].tanggal)}, ${sesi7[0].jamMulai} WIB — ${sesi7[0].judul}`
              : dalam7Hari.length ? `${dalam7Hari.length} kelas dimulai dalam 7 hari ke depan` : "Tidak ada kelas dalam 7 hari ke depan"}
          </p>
        </Kartu>

        <Kartu icon={Award} judul="Sertifikat Saya" tombol="Unduh Sertifikat" href="/portal/sertifikat">
          <p className="text-3xl font-semibold text-navy">{lulus}</p>
          <p className="text-sm text-slate-500">Sertifikat Diperoleh</p>
          <div className="mt-4 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex h-14 flex-1 items-center justify-center rounded-md border-2 ${i < lulus ? "border-gold/60 bg-amber-50 text-gold" : "border-dashed border-slate-200 text-slate-300"}`}>
                <Award className="h-5 w-5" />
              </div>
            ))}
          </div>
        </Kartu>
      </div>

      <h2 id="kelas-saya" className="mb-3 font-serif text-xl font-semibold text-navy">Kelas Saya</h2>

      {pendaftaran.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Kamu belum terdaftar di Kelas Diklat manapun.
        </p>
      )}

      <div className="space-y-6">
        {pendaftaran.map((pd) => {
          const kelas = pd.kelas;
          const materi = kelas.judulDiklat.materi;
          const totalJp = materi.reduce((n, m) => n + m.durasiJp, 0);
          const sertifikatSiap = pd.statusKelulusan === "LULUS" && pd.sertifikatUrl;
          const infoItems = [
            { icon: CalendarDays, label: "Jadwal", value: `${formatTanggal(kelas.tanggalMulai)} – ${formatTanggal(kelas.tanggalSelesai)}` },
            { icon: MapPin, label: "Lokasi", value: kelas.lokasiAtauLink },
            { icon: Clock, label: "Total Jam Pelajaran", value: `${totalJp} JP` },
            { icon: Award, label: "Nilai", value: pd.nilai != null ? String(Number(pd.nilai)) : "Belum ada" },
          ];
          return (
            <section key={pd.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{kelas.judulDiklat.kode} · {kelas.judulDiklat.kategori}</p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-navy">{kelas.judulDiklat.nama}</h3>
                  <p className="text-sm text-slate-500">{kelas.namaBatch}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {kelas.status === "BERJALAN" ? "Berjalan" : kelas.status === "SELESAI" ? "Selesai" : "Persiapan"}
                  </span>
                  <Badge status={pd.statusKelulusan} />
                </div>
              </div>

              {/* Info ringkas */}
              <dl className="grid gap-4 border-y border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
                {infoItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="text-sm font-medium text-slate-800">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              {/* Kehadiran */}
              {(() => {
                const sesiK = sesiAll.filter((s) => s.kelasId === kelas.id);
                if (!sesiK.length) return null;
                const lalu = sesiK.filter((s) => tglKey(s) <= hariIniKey);
                const hadir = lalu.filter((s) => s.presensi[0]?.status === "HADIR").length;
                const persen = lalu.length ? Math.round((hadir / lalu.length) * 100) : 0;
                const warna = { HADIR: "bg-emerald-50 text-emerald-700 border-emerald-200", IZIN: "bg-sky-50 text-sky-700 border-sky-200", SAKIT: "bg-amber-50 text-amber-700 border-amber-200", ALPA: "bg-rose-50 text-rose-700 border-rose-200" };
                const label = { HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", ALPA: "Alpa" };
                return (
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-navy">Kehadiran</span>
                      <span className="text-slate-500">{lalu.length ? `${hadir} dari ${lalu.length} sesi (${persen}%)` : "Belum ada sesi berlangsung"}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${persen >= (kelas.kehadiranMinimal ?? 80) ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${persen}%` }} />
                      <span className="absolute -top-1 h-4 w-0.5 bg-slate-400" style={{ left: `${kelas.kehadiranMinimal ?? 80}%` }} title={`Batas minimal ${kelas.kehadiranMinimal ?? 80}%`} />
                    </div>
                    <p className="mt-1 text-right text-[11px] text-slate-400">Batas minimal {kelas.kehadiranMinimal ?? 80}%</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sesiK.map((s) => {
                        const st = s.presensi[0]?.status;
                        const akan = tglKey(s) > hariIniKey;
                        return (
                          <span key={s.id} title={`${s.judul} · ${s.jamMulai}–${s.jamSelesai}`} className={`rounded-md border px-2 py-1 text-xs ${st ? warna[st] : akan ? "border-slate-200 bg-white text-slate-500" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                            {formatTanggal(s.tanggal).replace(/ \d{4}$/, "")} · {st ? label[st] : akan ? "Akan datang" : "Belum dicatat"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Isi: Materi (kiri) + Sertifikat (kanan) */}
              <div className="grid gap-6 p-5 lg:grid-cols-[1fr,18rem]">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-navy">Materi ({materi.length})</h4>
                  {materi.length === 0 && <p className="text-sm text-slate-400">Belum ada materi untuk diklat ini.</p>}
                  <ol className="space-y-2">
                    {materi.map((m, i) => (
                      <li key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/5 text-sm font-semibold text-navy">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{m.judulMateri}</p>
                          <p className="text-xs text-slate-400">{m.durasiJp} JP</p>
                        </div>
                        {m.fileSilabusUrl ? (
                          <a href={m.fileSilabusUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                            <FileText className="h-3.5 w-3.5" /> Silabus
                          </a>
                        ) : (
                          <span className="shrink-0 text-xs text-slate-300">Silabus belum ada</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                <aside className={`flex flex-col rounded-lg border p-4 ${sertifikatSiap ? "border-gold/40 bg-amber-50/50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <Award className={`h-5 w-5 ${sertifikatSiap ? "text-gold" : "text-slate-300"}`} /> Sertifikat
                  </div>
                  {sertifikatSiap ? (
                    <>
                      <p className="mt-2 text-sm text-slate-600">Selamat, kamu dinyatakan lulus.</p>
                      {pd.nomorSertifikat && <p className="mt-1 break-all font-mono text-xs text-slate-500">No. {pd.nomorSertifikat}</p>}
                      <a href={pd.sertifikatUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357]">
                        <Download className="h-4 w-4" /> Unduh Sertifikat
                      </a>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      {pd.statusKelulusan === "LULUS"
                        ? "Kamu dinyatakan lulus. Sertifikat sedang diproses admin, cek lagi beberapa saat."
                        : pd.statusKelulusan === "PROSES"
                        ? "Tersedia setelah kelas selesai dan kamu dinyatakan lulus."
                        : "Belum memenuhi syarat kelulusan untuk kelas ini."}
                    </p>
                  )}
                </aside>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
