"use client";

/**
 * KelasDiklatDetail.jsx
 * -----------------------------------------------------------------------
 * Halaman Detail Kelas Diklat — Tabbed Layout.
 * Menggabungkan: Judul Diklat (header), Overview, Materi & Narasumber,
 * Peserta (search/filter/export/import), dan Panitia.
 *
 * Stack: React + Tailwind CSS + lucide-react
 * Cara pakai: <KelasDiklatDetail kelas={data} /> — lihat MOCK_KELAS di
 * bawah untuk bentuk data yang diharapkan (biasanya hasil fetch/Prisma).
 *
 * Catatan integrasi:
 * - Ganti MOCK_KELAS dengan data dari API (mis. React Query:
 *   useQuery(['kelas', id], () => fetch(`/api/kelas/${id}`)) ).
 * - Fungsi handleExportCSV & handleImportCSV adalah implementasi minimal
 *   (tanpa dependency) — untuk produksi, ganti dengan `xlsx`/`exceljs`
 *   agar mendukung format .xlsx penuh (styling, multi-sheet, dsb).
 * -----------------------------------------------------------------------
 */

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import KelasHeaderActions from "@/components/KelasHeaderActions";
import SertifikatCell from "@/components/SertifikatCell";
import JadwalPresensi from "@/components/JadwalPresensi";
import NilaiKelulusan from "@/components/NilaiKelulusan";
import KelasHero from "@/components/KelasHero";
import OverviewKelas from "@/components/OverviewKelas";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Search,
  Download,
  Upload,
  GraduationCap,
  BookOpen,
  UserRound,
  ClipboardList,
  Mail,
  Phone,
  Building2,
  ChevronDown,
  MoreHorizontal,
  CalendarCheck,
  ClipboardCheck,
  Pencil,
} from "lucide-react";

// ---------------------------------------------------------------------
// MOCK DATA — bentuk ini mencerminkan hasil join Prisma (lihat schema.prisma)
// ---------------------------------------------------------------------
const MOCK_KELAS = {
  id: "kelas-001",
  namaBatch: "Angkatan 12",
  judulDiklat: {
    nama: "Diklat Kepemimpinan Administrator",
    kode: "DKA-2026",
    kategori: "Kepemimpinan",
  },
  tanggalMulai: "2026-09-12",
  tanggalSelesai: "2026-09-20",
  lokasiAtauLink: "Pusdiklat Regional III, Batam",
  kuota: 30,
  status: "BERJALAN", // PERSIAPAN | BERJALAN | SELESAI
  materi: [
    {
      id: "m1",
      judulMateri: "Manajemen Perubahan di Sektor Publik",
      durasiJp: 8,
      narasumber: [{ id: "n1", nama: "Dr. Siti Rahmawati", kepakaran: "Manajemen Perubahan" }],
    },
    {
      id: "m2",
      judulMateri: "Pengambilan Keputusan Berbasis Data",
      durasiJp: 6,
      narasumber: [{ id: "n2", nama: "Ir. Bambang Wijaya, M.T.", kepakaran: "Data & Kebijakan Publik" }],
    },
    {
      id: "m3",
      judulMateri: "Etika dan Integritas Kepemimpinan",
      durasiJp: 4,
      narasumber: [
        { id: "n1", nama: "Dr. Siti Rahmawati", kepakaran: "Manajemen Perubahan" },
        { id: "n3", nama: "Prof. Herman Sutopo", kepakaran: "Etika Pemerintahan" },
      ],
    },
  ],
  panitia: [
    { id: "p1", nama: "Ayu Lestari", peranPj: "Koordinator Kelas", kontak: "0812-3456-7890" },
    { id: "p2", nama: "Dedi Kurniawan", peranPj: "Admin & Logistik", kontak: "0813-2211-0099" },
  ],
  peserta: [
    { id: "pes1", nama: "Andi Saputra", nipNik: "198501012010011001", instansi: "Pemkot Batam", email: "andi.saputra@pemko.go.id", nilai: 88, statusKelulusan: "LULUS" },
    { id: "pes2", nama: "Rina Marlina", nipNik: "199002152012022002", instansi: "Kemenkeu", email: "rina.marlina@kemenkeu.go.id", nilai: 76, statusKelulusan: "LULUS" },
    { id: "pes3", nama: "Fajar Nugroho", nipNik: "198811302015031003", instansi: "Pemprov Kepri", email: "fajar.n@kepriprov.go.id", nilai: null, statusKelulusan: "PROSES" },
    { id: "pes4", nama: "Wulan Sari", nipNik: "199305202016042004", instansi: "BKN", email: "wulan.sari@bkn.go.id", nilai: 58, statusKelulusan: "TIDAK_LULUS" },
    { id: "pes5", nama: "Yusuf Hidayat", nipNik: "199111112013011005", instansi: "Pemkab Bintan", email: "yusuf.h@bintankab.go.id", nilai: 91, statusKelulusan: "LULUS" },
  ],
};

// ---------------------------------------------------------------------
// Helper kecil: badge status berwarna (dot + label — bukan pill seragam)
// ---------------------------------------------------------------------
const STATUS_STYLES = {
  AKTIF: { dot: "bg-emerald-600", text: "text-emerald-800", bg: "bg-emerald-50", label: "Aktif" },
  BERJALAN: { dot: "bg-emerald-600", text: "text-emerald-800", bg: "bg-emerald-50", label: "Berjalan" },
  PERSIAPAN: { dot: "bg-amber-600", text: "text-amber-800", bg: "bg-amber-50", label: "Persiapan" },
  DRAFT: { dot: "bg-amber-600", text: "text-amber-800", bg: "bg-amber-50", label: "Draft" },
  SELESAI: { dot: "bg-slate-500", text: "text-slate-700", bg: "bg-slate-100", label: "Selesai" },
  LULUS: { dot: "bg-emerald-600", text: "text-emerald-800", bg: "bg-emerald-50", label: "Lulus" },
  PROSES: { dot: "bg-amber-600", text: "text-amber-800", bg: "bg-amber-50", label: "Proses" },
  TIDAK_LULUS: { dot: "bg-rose-600", text: "text-rose-800", bg: "bg-rose-50", label: "Tidak Lulus" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PROSES;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const TABS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "materi", label: "Materi & Narasumber", icon: BookOpen },
  { key: "peserta", label: "Peserta", icon: Users },
  { key: "jadwal", label: "Jadwal & Presensi", icon: CalendarCheck },
  { key: "nilai", label: "Nilai & Kelulusan", icon: ClipboardCheck },
  { key: "panitia", label: "Panitia", icon: UserRound },
];

const EKSTRA_KOSONG = { sesiTotal: 0, sesiLalu: 0, komponen: 0, moodleCourseId: null, moodleUrl: "", waktu: { keterangan: "", progres: 0 } };

export default function KelasDiklatDetail({ kelas = MOCK_KELAS, ekstra = EKSTRA_KOSONG }) {
  const [activeTab, setActiveTab] = useState("overview");
  const pindahTab = (key) => {
    setActiveTab(key);
    setTimeout(() => document.getElementById("tab-kelas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const totalJp = useMemo(() => kelas.materi.reduce((sum, m) => sum + m.durasiJp, 0), [kelas.materi]);
  const totalPeserta = kelas.peserta.length;
  const lulusCount = kelas.peserta.filter((p) => p.statusKelulusan === "LULUS").length;

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#1C2130]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <KelasHero kelas={kelas} totalJp={totalJp} waktu={ekstra.waktu} />

        {/* ---------------- Tab strip (underline, bukan pill) ---------------- */}
        <nav id="tab-kelas" className="flex scroll-mt-4 gap-6 overflow-x-auto whitespace-nowrap border-b border-slate-200 [&>*]:shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#16233F] text-[#16233F]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {{ materi: kelas.materi.length, peserta: totalPeserta, jadwal: ekstra.sesiTotal }[tab.key] > 0 && (
                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {{ materi: kelas.materi.length, peserta: totalPeserta, jadwal: ekstra.sesiTotal }[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ---------------- Konten Tab ---------------- */}
        <div className="py-6">
          {activeTab === "overview" && <OverviewKelas kelas={kelas} ekstra={ekstra} totalJp={totalJp} onPindahTab={pindahTab} />}
          {activeTab === "materi" && <MateriNarasumberTab materi={kelas.materi} />}
          {activeTab === "peserta" && <PesertaTab peserta={kelas.peserta} kelasId={kelas.id} />}
          {activeTab === "jadwal" && <JadwalPresensi kelasId={kelas.id} />}
          {activeTab === "nilai" && <NilaiKelulusan kelasId={kelas.id} />}
          {activeTab === "panitia" && <PanitiaTab panitia={kelas.panitia} />}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#B8892B]" />
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="font-medium text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

// =======================================================================
// TAB: Overview
// =======================================================================
function OverviewTab({ kelas, totalJp, lulusCount }) {
  const persentaseLulus = kelas.peserta.length ? Math.round((lulusCount / kelas.peserta.length) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-[#16233F]">Ringkasan Kelas</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {kelas.namaBatch} dari program {kelas.judulDiklat.nama} dilaksanakan di {kelas.lokasiAtauLink} mulai{" "}
            {formatTanggal(kelas.tanggalMulai)} sampai {formatTanggal(kelas.tanggalSelesai)}, mencakup {kelas.materi.length}{" "}
            materi dengan total {totalJp} jam pelajaran.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-[#16233F]">Progres Kelulusan</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#B8892B]"
                style={{ width: `${persentaseLulus}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-[#16233F]">{persentaseLulus}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {lulusCount} dari {kelas.peserta.length} peserta dinyatakan lulus sejauh ini.
          </p>
        </section>
      </div>

      {/* Panel status — aksen border kiri berwarna, bukan shadow card generik */}
      <aside className="space-y-3">
        <div className="rounded-lg border-l-4 border-[#16233F] bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Status Kelas</p>
          <div className="mt-1"><StatusBadge status={kelas.status} /></div>
        </div>
        <div className="rounded-lg border-l-4 border-[#B8892B] bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Sisa Kuota</p>
          <p className="mt-1 text-lg font-semibold text-[#16233F]">
            {kelas.kuota - kelas.peserta.length} kursi
          </p>
        </div>
      </aside>
    </div>
  );
}

// =======================================================================
// TAB: Materi & Narasumber
// =======================================================================
function MateriNarasumberTab({ materi }) {
  return (
    <div className="space-y-3">
      {materi.map((m, idx) => (
        <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400">Materi {idx + 1}</p>
              <h3 className="font-serif text-base font-semibold text-[#16233F]">{m.judulMateri}</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              <Clock className="h-3.5 w-3.5" /> {m.durasiJp} JP
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.narasumber.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700"
              >
                <GraduationCap className="h-3.5 w-3.5 text-[#B8892B]" />
                {n.nama}
                <span className="text-xs text-slate-400">&middot; {n.kepakaran}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =======================================================================
// TAB: Peserta — search, filter status, export/import, edit nilai/status
// =======================================================================
function PesertaTab({ peserta, kelasId }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [editing, setEditing] = useState(null); // peserta yang lagi diedit nilai/statusnya
  const [adding, setAdding] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importSummary, setImportSummary] = useState("");
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    return peserta.filter((p) => {
      const matchQuery =
        p.nama.toLowerCase().includes(query.toLowerCase()) ||
        p.nipNik.includes(query) ||
        p.instansi.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === "SEMUA" || p.statusKelulusan === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [peserta, query, statusFilter]);

  // ---- Export ke file .xlsx asli (pakai SheetJS) ----
  function handleExportExcel() {
    const rows = filtered.map((p) => ({
      Nama: p.nama,
      "NIP/NIK": p.nipNik,
      Instansi: p.instansi,
      Email: p.email,
      Nilai: p.nilai ?? "",
      "Status Kelulusan": p.statusKelulusan,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Peserta");
    XLSX.writeFile(workbook, "peserta-diklat.xlsx");
  }

  // ---- Import dari .xlsx/.csv: baca file, daftarkan tiap baris ke kelas ini ----
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    setImportSummary("");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      let sukses = 0;
      let gagal = 0;
      for (const row of rows) {
        const nama = row.Nama || row.nama;
        const nipNik = row["NIP/NIK"] || row.nipNik || row.NIK || row.NIP;
        const instansi = row.Instansi || row.instansi || "-";
        const email = row.Email || row.email;
        if (!nama || !nipNik || !email) { gagal++; continue; }

        const res = await fetch(`/api/kelas/${kelasId}/peserta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peserta: { nama, nipNik: String(nipNik), instansi, email } }),
        });
        if (res.ok) sukses++; else gagal++;
      }
      setImportSummary(`Impor selesai: ${sukses} peserta berhasil ditambahkan${gagal ? `, ${gagal} baris gagal/dilewati` : ""}.`);
      router.refresh();
    } catch (err) {
      setImportSummary("Gagal membaca file. Pastikan formatnya .xlsx atau .csv dengan kolom Nama, NIP/NIK, Instansi, Email.");
    } finally {
      setImportBusy(false);
      e.target.value = "";
    }
  }

  async function handleUnenroll(p) {
    if (!confirm(`Keluarkan "${p.nama}" dari kelas ini?`)) return;
    const res = await fetch(`/api/kelas/${kelasId}/peserta/${p.id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal mengeluarkan peserta."); return; }
    router.refresh();
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, NIP/NIK, instansi..."
              className="w-64 rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[#16233F] focus:ring-1 focus:ring-[#16233F]"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm outline-none focus:border-[#16233F] focus:ring-1 focus:ring-[#16233F]"
            >
              <option value="SEMUA">Semua status</option>
              <option value="LULUS">Lulus</option>
              <option value="PROSES">Proses</option>
              <option value="TIDAK_LULUS">Tidak Lulus</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Tambah Peserta
          </button>
          <button
            onClick={handleImportClick}
            disabled={importBusy}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> {importBusy ? "Memproses..." : "Import"}
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#16233F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#223357]"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {importSummary && (
        <p className="mb-3 rounded-md border-l-4 border-[#B8892B] bg-slate-50 px-3 py-2 text-sm text-slate-700">{importSummary}</p>
      )}

      {/* Tabel peserta */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">NIP/NIK</th>
              <th className="px-4 py-3 font-medium">Instansi</th>
              <th className="px-4 py-3 font-medium">Nilai</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sertifikat</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{p.nama}</p>
                  <p className="text-xs text-slate-400">{p.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.nipNik}</td>
                <td className="px-4 py-3 text-slate-600">{p.instansi}</td>
                <td className="px-4 py-3 text-slate-600">{p.nilai ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.statusKelulusan} /></td>
                <td className="px-4 py-3"><SertifikatCell kelasId={kelasId} p={p} /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setEditing(p)} className="text-xs font-medium text-[#16233F] underline">Edit</button>
                  <button onClick={() => handleUnenroll(p)} className="text-xs font-medium text-rose-600 underline">Keluarkan</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                  Tidak ada peserta yang cocok dengan pencarian/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <EditNilaiModal peserta={editing} kelasId={kelasId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />}
      {adding && <TambahPesertaModal kelasId={kelasId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); router.refresh(); }} />}
    </div>
  );
}

// ---- Modal: edit nilai, status kelulusan, & link sertifikat ----
function EditNilaiModal({ peserta, kelasId, onClose, onSaved }) {
  const [nilai, setNilai] = useState(peserta.nilai ?? "");
  const [status, setStatus] = useState(peserta.statusKelulusan);
  const [sertifikatUrl, setSertifikatUrl] = useState(peserta.sertifikatUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/kelas/${kelasId}/peserta/${peserta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nilai: nilai === "" ? null : Number(nilai),
        statusKelulusan: status,
        sertifikatUrl: sertifikatUrl || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Gagal menyimpan."); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-[#16233F]">Nilai & Status — {peserta.nama}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nilai</label>
            <input type="number" min="0" max="100" value={nilai} onChange={(e) => setNilai(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status Kelulusan</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]">
              <option value="PROSES">Proses</option>
              <option value="LULUS">Lulus</option>
              <option value="TIDAK_LULUS">Tidak Lulus</option>
            </select>
          </div>
          {status === "LULUS" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Link Sertifikat (Google Drive)</label>
              <input value={sertifikatUrl} onChange={(e) => setSertifikatUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
              <p className="mt-1 text-xs text-slate-400">
                Unggah sertifikat ke Google Drive, atur sharing-nya jadi "Siapa saja yang memiliki link", lalu tempel link-nya di sini. Link ini yang akan muncul di Portal Peserta.
              </p>
              {peserta.sertifikatUrl && (
                <a href={peserta.sertifikatUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-[#16233F] underline">
                  Buka sertifikat yang sudah tersimpan
                </a>
              )}
            </div>
          )}
          {error && <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="rounded-md bg-[#16233F] px-4 py-2 text-sm text-white disabled:opacity-60">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Modal: tambah peserta (baru atau dari data peserta yang sudah ada) ----
function TambahPesertaModal({ kelasId, onClose, onSaved }) {
  const [mode, setMode] = useState("baru"); // "baru" | "cari"
  const [form, setForm] = useState({ nama: "", nipNik: "", instansi: "", email: "" });
  const [query, setQuery] = useState("");
  const [hasil, setHasil] = useState([]);
  const [dipilih, setDipilih] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(q) {
    setQuery(q);
    setDipilih(null);
    if (q.length < 2) { setHasil([]); return; }
    const res = await fetch(`/api/peserta?q=${encodeURIComponent(q)}`);
    setHasil(res.ok ? await res.json() : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = mode === "cari" && dipilih ? { pesertaId: dipilih.id } : { peserta: form };
    const res = await fetch(`/api/kelas/${kelasId}/peserta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Gagal menambahkan peserta."); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-[#16233F]">Tambah Peserta ke Kelas</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="mb-4 flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === "baru"} onChange={() => setMode("baru")} /> Peserta baru
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === "cari"} onChange={() => setMode("cari")} /> Cari peserta yang sudah ada
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "baru" ? (
            <>
              <input required placeholder="Nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
              <input required placeholder="NIP/NIK" value={form.nipNik} onChange={(e) => setForm((f) => ({ ...f, nipNik: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
              <input required placeholder="Instansi" value={form.instansi} onChange={(e) => setForm((f) => ({ ...f, instansi: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
            </>
          ) : (
            <>
              <input placeholder="Cari nama / NIP/NIK / instansi..." value={query} onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#16233F]" />
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {hasil.map((p) => (
                  <button type="button" key={p.id} onClick={() => setDipilih(p)}
                    className={`block w-full rounded-md border p-2 text-left text-sm ${dipilih?.id === p.id ? "border-[#16233F] bg-slate-50" : "border-slate-200"}`}>
                    <p className="font-medium">{p.nama}</p>
                    <p className="text-xs text-slate-400">{p.nipNik} · {p.instansi}</p>
                  </button>
                ))}
              </div>
            </>
          )}
          {error && <p className="rounded-md border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Batal</button>
            <button type="submit" disabled={saving || (mode === "cari" && !dipilih)} className="rounded-md bg-[#16233F] px-4 py-2 text-sm text-white disabled:opacity-60">
              {saving ? "Menyimpan..." : "Tambahkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =======================================================================
// TAB: Panitia
// =======================================================================
function PanitiaTab({ panitia }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {panitia.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16233F] text-sm font-semibold text-white">
            {p.nama.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-800">{p.nama}</p>
            <p className="text-xs text-slate-500">{p.peranPj}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <Phone className="h-3 w-3" /> {p.kontak}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
