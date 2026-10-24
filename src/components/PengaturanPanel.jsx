"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Palette, LogIn, Activity, UploadCloud, Link2, RotateCcw, CheckCircle2, XCircle, AlertTriangle, MinusCircle, Loader2, Image as ImageIcon } from "lucide-react";

const TIPE_LOGO = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const TIPE_BG = ["image/png", "image/jpeg", "image/webp"];
const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10";
const tombolUtama = "rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#223357] disabled:cursor-not-allowed disabled:opacity-40";

// Unggah dengan indikator progres (XMLHttpRequest)
function unggah(url, field, file, onProgress) {
  return new Promise((selesai) => {
    const fd = new FormData(); fd.append(field, file);
    const x = new XMLHttpRequest();
    x.open("POST", url);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} selesai({ ok: x.status >= 200 && x.status < 300, ...d }); };
    x.onerror = () => selesai({ ok: false, error: "Tidak bisa terhubung ke server." });
    x.send(fd);
  });
}
const urlValid = (v) => /^(https?:\/\/|\/)/i.test(v.trim());

// Area seret-lepas / klik untuk memilih file
function Dropzone({ judul, petunjuk, tipe, maksMB, onFile, progres }) {
  const input = useRef(null);
  const [seret, setSeret] = useState(false);
  const [galat, setGalat] = useState("");
  const sibuk = progres !== null;

  function proses(file) {
    setGalat("");
    if (!file) return;
    if (!tipe.includes(file.type)) return setGalat(`Format tidak didukung. Gunakan ${tipe.map((t) => t.split("/")[1].replace("svg+xml", "svg").toUpperCase()).join(", ")}.`);
    if (file.size > maksMB * 1024 * 1024) return setGalat(`Ukuran ${(file.size / 1048576).toFixed(1)}MB melebihi batas ${maksMB}MB.`);
    onFile(file);
  }
  return (
    <div>
      <div
        onClick={() => !sibuk && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setSeret(true); }} onDragLeave={() => setSeret(false)}
        onDrop={(e) => { e.preventDefault(); setSeret(false); if (!sibuk) proses(e.dataTransfer.files?.[0]); }}
        role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !sibuk && input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${seret ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50/60 hover:border-navy hover:bg-white"} ${sibuk ? "cursor-wait" : ""}`}>
        {sibuk ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <p className="mt-2 text-sm font-medium text-slate-700">Mengunggah... {progres}%</p>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-sky-600 transition-all" style={{ width: `${progres}%` }} /></div>
          </>
        ) : (
          <>
            <UploadCloud className={`h-9 w-9 ${seret ? "text-sky-600" : "text-slate-400"}`} />
            <p className="mt-2 text-sm font-medium text-slate-700">{judul}</p>
            <p className="mt-0.5 text-xs text-slate-500">{petunjuk}</p>
          </>
        )}
        <input ref={input} type="file" accept={tipe.join(",")} className="hidden" onChange={(e) => { proses(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {galat && <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600"><XCircle className="h-4 w-4" />{galat}</p>}
    </div>
  );
}

function Logo({ src, nama, ukuran = "h-10 w-10" }) {
  return src
    ? <img src={src} alt="" className={`${ukuran} shrink-0 rounded-full bg-white object-cover`} />
    : <span className={`${ukuran} flex shrink-0 items-center justify-center rounded-full bg-navy font-serif text-xs font-bold text-gold ring-1 ring-white/20`}>{String(nama || "SD").trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("").toUpperCase()}</span>;
}

// Pratinjau sidebar
function PratinjauSidebar({ logo, nama }) {
  const menu = ["Dashboard", "Kelas Diklat", "Peserta", "Pengaturan"];
  return (
    <div className="w-52 overflow-hidden rounded-xl bg-navy text-white shadow-lg">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4"><Logo src={logo} nama={nama} ukuran="h-9 w-9" /><span className="truncate font-serif text-sm font-semibold">{nama || "SIM Diklat"}</span></div>
      <ul className="space-y-1 p-3 text-xs">
        {menu.map((m, i) => <li key={m} className={`rounded-md px-3 py-2 ${i === 3 ? "bg-white/15 font-semibold" : "text-white/75"}`}>{m}</li>)}
      </ul>
    </div>
  );
}

// Pratinjau halaman masuk
function PratinjauLogin({ bg, logo, nama }) {
  const kaca = !!bg;
  return (
    <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-paper bg-cover bg-center" style={bg ? { backgroundImage: `url(${bg})` } : undefined}>
      {bg && <div className="absolute inset-0 bg-navy/40" />}
      <div className={`relative w-[58%] rounded-lg p-3 text-center ${kaca ? "border border-white/30 bg-white/25 backdrop-blur-md" : "border border-slate-200 bg-white shadow-sm"}`}>
        <div className="mx-auto w-fit"><Logo src={logo} nama={nama} ukuran="h-8 w-8" /></div>
        <p className={`mt-1.5 font-serif text-xs font-semibold ${kaca ? "text-white" : "text-navy"}`}>{nama || "SIM Diklat"}</p>
        <div className="mt-2 space-y-1.5"><div className="h-5 rounded bg-white/90" /><div className="h-5 rounded bg-white/90" /><div className="h-5 rounded bg-navy" /></div>
      </div>
    </div>
  );
}

const IKON = { ok: [CheckCircle2, "text-emerald-600", "bg-emerald-50 border-emerald-200", "Baik"], warn: [AlertTriangle, "text-amber-600", "bg-amber-50 border-amber-200", "Perlu perhatian"], off: [MinusCircle, "text-slate-400", "bg-slate-50 border-slate-200", "Tidak aktif"] };

export default function PengaturanPanel({ awal, status, info }) {
  const router = useRouter();
  const [tab, setTab] = useState("tampilan");
  const [toast, setToast] = useState(null);
  const [logo, setLogo] = useState(awal.logoUrl);
  const [bg, setBg] = useState(awal.backgroundUrl);
  const [nama, setNama] = useState(awal.namaAplikasi);
  const [namaDraft, setNamaDraft] = useState(awal.namaAplikasi);
  const [progLogo, setProgLogo] = useState(null);
  const [progBg, setProgBg] = useState(null);
  const [linkLogo, setLinkLogo] = useState(""); const [bukaLinkLogo, setBukaLinkLogo] = useState(false);
  const [linkBg, setLinkBg] = useState(""); const [bukaLinkBg, setBukaLinkBg] = useState(false);
  const [tes, setTes] = useState({ proses: false, hasil: null });

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);
  const ok = (text) => setToast({ ok: true, text });
  const gagal = (text) => setToast({ ok: false, text });

  async function patch(body) {
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { gagal(d.error || "Gagal menyimpan."); return false; }
    router.refresh();
    return true;
  }
  async function segarkan() { const d = await fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => null); if (d) { setLogo(d.logoUrl || ""); setBg(d.backgroundUrl || ""); } }

  async function unggahLogo(file) {
    setProgLogo(0);
    const r = await unggah("/api/settings/logo", "logo", file, setProgLogo);
    setProgLogo(null);
    if (!r.ok) return gagal(r.error || "Gagal mengunggah logo.");
    await segarkan(); router.refresh(); ok("Logo berhasil diperbarui.");
  }
  async function unggahBg(file) {
    setProgBg(0);
    const r = await unggah("/api/settings/background", "background", file, setProgBg);
    setProgBg(null);
    if (!r.ok) return gagal(r.error || "Gagal mengunggah background.");
    await segarkan(); router.refresh(); ok("Background halaman masuk diperbarui.");
  }
  async function simpanLinkLogo() { if (!urlValid(linkLogo)) return gagal("Link harus diawali http://, https://, atau /."); if (await patch({ logoUrl: linkLogo.trim() })) { setLogo(linkLogo.trim()); setLinkLogo(""); setBukaLinkLogo(false); ok("Logo diperbarui dari link."); } }
  async function simpanLinkBg() { if (!urlValid(linkBg)) return gagal("Link harus diawali http://, https://, atau /."); if (await patch({ backgroundUrl: linkBg.trim() })) { setBg(linkBg.trim()); setLinkBg(""); setBukaLinkBg(false); ok("Background diperbarui dari link."); } }
  async function resetLogo() { if (confirm("Kembalikan logo ke bawaan (inisial)?") && (await patch({ logoUrl: null }))) { setLogo(""); ok("Logo dikembalikan ke bawaan."); } }
  async function resetBg() { if (confirm("Hapus background dan kembali ke latar polos?") && (await patch({ backgroundUrl: null }))) { setBg(""); ok("Background dihapus."); } }
  async function simpanNama() { const n = namaDraft.trim(); if (await patch({ namaAplikasi: n })) { setNama(n); setNamaDraft(n); ok("Nama aplikasi disimpan."); } }

  async function tesMoodle() {
    setTes({ proses: true, hasil: null });
    const r = await fetch("/api/pengaturan/tes-moodle", { method: "POST" }).then((x) => x.json()).catch(() => ({ ok: false, pesan: "Tidak bisa menghubungi server." }));
    setTes({ proses: false, hasil: r });
  }

  const namaBerubah = namaDraft.trim() !== nama;
  const namaValid = namaDraft.trim().length >= 2 && namaDraft.length <= 40;
  const tabs = [["tampilan", "Tampilan", Palette], ["masuk", "Halaman Masuk", LogIn], ["sistem", "Sistem", Activity]];
  const perhatian = status.filter((s) => s.tingkat === "warn").length;

  return (
    <div className="max-w-6xl">
      <h1 className="font-serif text-2xl font-semibold text-navy">Pengaturan Aplikasi</h1>
      <p className="mt-1 text-sm text-slate-500">Atur identitas tampilan aplikasi dan pantau kesiapan sistem.</p>

      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 [&>*]:shrink-0">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === id ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <Icon className="h-4 w-4" /> {label}
            {id === "sistem" && perhatian > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">{perhatian}</span>}
          </button>
        ))}
      </div>

      {/* ============ TAMPILAN ============ */}
      {tab === "tampilan" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,18rem]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-navy">Nama Aplikasi</h2>
              <p className="mb-3 text-xs text-slate-500">Tampil di sidebar dan halaman masuk.</p>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[14rem] flex-1">
                  <input value={namaDraft} onChange={(e) => setNamaDraft(e.target.value)} maxLength={40} className={inputCls} placeholder="SIM Diklat" onKeyDown={(e) => e.key === "Enter" && namaBerubah && namaValid && simpanNama()} />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{namaDraft.length}/40</p>
                </div>
                <button onClick={simpanNama} disabled={!namaBerubah || !namaValid} className={`${tombolUtama} h-[2.65rem]`}>Simpan</button>
                {namaBerubah && <button onClick={() => setNamaDraft(nama)} className="h-[2.65rem] px-2 text-sm text-slate-500 hover:text-slate-800">Batalkan</button>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div><h2 className="font-serif text-lg font-semibold text-navy">Logo</h2><p className="text-xs text-slate-500">Persegi atau bulat paling bagus. PNG, JPG, WEBP, atau SVG; maksimal 2MB.</p></div>
                {logo && <button onClick={resetLogo} className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Kembalikan ke bawaan</button>}
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex flex-col items-center gap-1"><Logo src={logo} nama={namaDraft} ukuran="h-20 w-20" /><span className="text-[11px] text-slate-400">Logo saat ini</span></div>
                <div className="min-w-[14rem] flex-1"><Dropzone judul="Seret logo ke sini atau klik untuk memilih" petunjuk="Langsung terpasang setelah diunggah" tipe={TIPE_LOGO} maksMB={2} onFile={unggahLogo} progres={progLogo} /></div>
              </div>
              <button onClick={() => setBukaLinkLogo((b) => !b)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline"><Link2 className="h-3.5 w-3.5" /> {bukaLinkLogo ? "Sembunyikan" : "Atau pakai link gambar"}</button>
              {bukaLinkLogo && (
                <div className="mt-2 flex gap-2"><input value={linkLogo} onChange={(e) => setLinkLogo(e.target.value)} placeholder="https://..." className={inputCls} /><button onClick={simpanLinkLogo} disabled={!linkLogo.trim()} className={tombolUtama}>Simpan</button></div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pratinjau Sidebar</p>
            <PratinjauSidebar logo={logo} nama={namaDraft} />
            <p className="mt-3 text-xs text-slate-400">Berubah langsung saat Anda mengetik nama, sebelum disimpan.</p>
          </aside>
        </div>
      )}

      {/* ============ HALAMAN MASUK ============ */}
      {tab === "masuk" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div><h2 className="font-serif text-lg font-semibold text-navy">Gambar Latar</h2><p className="text-xs text-slate-500">Dipakai di halaman Masuk dan Daftar; formulir tampil transparan (efek kaca). Gambar landscape beresolusi besar paling bagus. PNG, JPG, atau WEBP; maksimal 5MB.</p></div>
            </div>
            <Dropzone judul="Seret gambar latar ke sini atau klik untuk memilih" petunjuk="Langsung terpasang setelah diunggah" tipe={TIPE_BG} maksMB={5} onFile={unggahBg} progres={progBg} />
            {bg && <button onClick={resetBg} className="mt-3 inline-flex items-center gap-1 text-xs text-rose-600 hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Kembalikan ke polos (tanpa background)</button>}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button onClick={() => setBukaLinkBg((b) => !b)} className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline"><Link2 className="h-3.5 w-3.5" /> {bukaLinkBg ? "Sembunyikan" : "Atau pakai link gambar"}</button>
              {bukaLinkBg && <div className="mt-2 flex gap-2"><input value={linkBg} onChange={(e) => setLinkBg(e.target.value)} placeholder="https://..." className={inputCls} /><button onClick={simpanLinkBg} disabled={!linkBg.trim()} className={tombolUtama}>Simpan</button></div>}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pratinjau Halaman Masuk</p>
            <PratinjauLogin bg={bg} logo={logo} nama={nama} />
            {!bg && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><ImageIcon className="h-4 w-4" /> Belum ada gambar latar; halaman masuk memakai warna polos.</p>}
          </section>
        </div>
      )}

      {/* ============ SISTEM ============ */}
      {tab === "sistem" && (
        <div className="mt-6">
          <div className="grid gap-3 md:grid-cols-2">
            {status.map((s) => {
              const [Icon, warna, kotak, label] = IKON[s.tingkat];
              return (
                <div key={s.id} className={`rounded-xl border p-4 ${kotak}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${warna}`}><Icon className="h-4 w-4" />{label}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{s.detail}</p>
                  {s.saran && <p className="mt-1 text-xs text-slate-500">→ {s.saran}</p>}
                  {s.id === "moodle" && s.tingkat !== "off" && (
                    <div className="mt-3">
                      <button onClick={tesMoodle} disabled={tes.proses} className="rounded-md border border-navy bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50 disabled:opacity-50">{tes.proses ? "Memeriksa..." : "Tes koneksi Moodle"}</button>
                      {tes.hasil && <p className={`mt-2 text-xs ${tes.hasil.ok ? (tes.hasil.tingkat === "warn" ? "text-amber-700" : "text-emerald-700") : "text-rose-700"}`}>{tes.hasil.pesan}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
            <span>Mode: <b className="text-slate-700">{info.mode}</b></span><span>Node.js: <b className="text-slate-700">{info.node}</b></span>
            <span className="text-slate-400">Pengaturan di panel ini dibaca dari file .env; ubah di sana lalu restart server.</span>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-emerald-600" : "bg-rose-600"}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />} {toast.text}
        </div>
      )}
    </div>
  );
}
