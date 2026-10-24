"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Copy, Check, Eye, EyeOff, Lock, User, ShieldCheck, BookOpen, Award, Mail, Hash, Building2, CheckCircle2, XCircle } from "lucide-react";

const UKURAN = 256;
// Potong tengah jadi persegi 256x256 (JPEG) sebelum diunggah
async function kecilkan(file) {
  const bmp = await createImageBitmap(file);
  const sisi = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = UKURAN;
  c.getContext("2d").drawImage(bmp, (bmp.width - sisi) / 2, (bmp.height - sisi) / 2, sisi, sisi, 0, 0, UKURAN, UKURAN);
  return new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
}

const STATUS = {
  LULUS: ["Lulus", "bg-emerald-50 text-emerald-700", "bg-emerald-500"],
  PROSES: ["Proses", "bg-amber-50 text-amber-700", "bg-amber-500"],
  TIDAK_LULUS: ["Tidak Lulus", "bg-rose-50 text-rose-700", "bg-rose-500"],
};

function kekuatan(p) {
  const aturan = [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p) || p.length >= 12];
  return { aturan, skor: aturan.filter(Boolean).length };
}

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10";

export default function ProfilPeserta({ nama, email, nipNik, instansi, fotoUrl, bergabung, stats, kelasList }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("profil");
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState("");

  // foto
  const [foto, setFoto] = useState(fotoUrl || null);
  const [upload, setUpload] = useState(false);

  // data diri
  const [base, setBase] = useState({ nama, instansi });
  const [form, setForm] = useState({ nama, instansi });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const dirty = form.nama.trim() !== base.nama || form.instansi.trim() !== base.instansi;
  const valid = form.nama.trim() && form.instansi.trim();

  // kata sandi
  const [pw, setPw] = useState({ lama: "", baru: "", konf: "" });
  const [lihat, setLihat] = useState({ lama: false, baru: false, konf: false });
  const [savingPw, setSavingPw] = useState(false);
  const [errPw, setErrPw] = useState("");
  const kuat = kekuatan(pw.baru);
  const cocok = pw.konf !== "" && pw.baru === pw.konf;
  const pwOk = pw.lama && kuat.aturan[0] && cocok;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const inisial = base.nama.trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("").toUpperCase();
  const gabung = bergabung ? new Date(bergabung).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : null;

  async function salin(kunci, teks) {
    await navigator.clipboard?.writeText(teks);
    setCopied(kunci);
    setTimeout(() => setCopied(""), 1500);
  }

  async function pilihFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setToast({ ok: false, msg: "File harus berupa gambar." });
    setUpload(true);
    try {
      const fd = new FormData();
      fd.append("foto", await kecilkan(file), "foto.jpg");
      const res = await fetch("/api/portal/foto", { method: "POST", body: fd });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error || "Gagal mengunggah foto.");
      setFoto(d.fotoUrl);
      setToast({ ok: true, msg: "Foto profil diperbarui." });
      router.refresh();
    } catch (er) {
      setToast({ ok: false, msg: er.message });
    } finally {
      setUpload(false);
    }
  }

  async function hapusFoto() {
    setUpload(true);
    const res = await fetch("/api/portal/foto", { method: "DELETE" });
    setUpload(false);
    if (!res.ok) return setToast({ ok: false, msg: "Gagal menghapus foto." });
    setFoto(null);
    setToast({ ok: true, msg: "Foto profil dihapus." });
    router.refresh();
  }

  async function simpanProfil(e) {
    e.preventDefault();
    if (!dirty || !valid) return;
    setErr(""); setSaving(true);
    const res = await fetch("/api/portal/profil", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: form.nama.trim(), instansi: form.instansi.trim() }),
    });
    const d = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return setErr(d?.error || "Gagal menyimpan.");
    setBase({ nama: form.nama.trim(), instansi: form.instansi.trim() });
    setToast({ ok: true, msg: "Profil berhasil diperbarui." });
    router.refresh();
  }

  async function simpanPw(e) {
    e.preventDefault();
    if (!pwOk) return;
    setErrPw(""); setSavingPw(true);
    const res = await fetch("/api/portal/password", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordLama: pw.lama, passwordBaru: pw.baru }),
    });
    const d = await res.json().catch(() => null);
    setSavingPw(false);
    if (!res.ok) return setErrPw(d?.error || "Gagal mengganti kata sandi.");
    setPw({ lama: "", baru: "", konf: "" });
    setToast({ ok: true, msg: "Kata sandi berhasil diganti." });
  }

  const tabs = [["profil", "Data Diri", User], ["keamanan", "Keamanan", ShieldCheck], ["kelas", "Riwayat Kelas", BookOpen]];
  const statCards = [["Kelas Diikuti", stats.kelas, BookOpen], ["Dinyatakan Lulus", stats.lulus, CheckCircle2], ["Sertifikat", stats.sertifikat, Award]];

  return (
    <div className="max-w-5xl">
      {/* Header profil */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-navy via-[#223357] to-sky-700" />
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
            <div className="group relative -mt-14">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={upload} aria-label="Ganti foto profil"
                className="relative block h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-navy shadow-md">
                {foto ? <img src={foto} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-serif text-3xl font-semibold text-gold">{inisial}</span>}
                <span className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-navy/60 text-xs font-medium text-white transition ${upload ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <Camera className="h-5 w-5" /> {upload ? "Memproses..." : "Ganti foto"}
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pilihFoto} />
            </div>
            <div className="min-w-0 flex-1 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl font-semibold text-navy">{base.nama}</h2>
                <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-medium text-navy">Peserta</span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{base.instansi}</span>
                {gabung && <span>Bergabung sejak {gabung}</span>}
              </p>
              {foto && !upload && <button type="button" onClick={hapusFoto} className="mt-1 text-xs text-rose-600 hover:underline">Hapus foto</button>}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {statCards.map(([label, nilai, Icon]) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-gold/50 hover:bg-white hover:shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gold shadow-sm"><Icon className="h-5 w-5" /></span>
                <div><p className="text-2xl font-semibold leading-none text-navy">{nilai}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab */}
      <div role="tablist" className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === id ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* Data diri */}
        {tab === "profil" && (
          <form onSubmit={simpanProfil} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input className={inputCls} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Instansi</label>
                <input className={inputCls} value={form.instansi} onChange={(e) => setForm({ ...form, instansi: e.target.value })} />
              </div>
              {[["email", "Email", email, Mail], ["nip", "NIP/NIK", nipNik, Hash]].map(([k, label, val, Icon]) => (
                <div key={k}>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">{label} <Lock className="h-3.5 w-3.5 text-slate-400" /></label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate">{val}</span>
                    <button type="button" onClick={() => salin(k, val)} className="shrink-0 text-slate-400 transition hover:text-navy" aria-label={`Salin ${label}`}>
                      {copied === k ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Email dan NIP/NIK tidak bisa diubah sendiri. Hubungi admin kalau perlu diganti.</p>
            {err && <p className="mt-4 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button type="submit" disabled={!dirty || !valid || saving}
                className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#223357] disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              {dirty && <button type="button" onClick={() => { setForm(base); setErr(""); }} className="text-sm text-slate-500 hover:text-slate-800">Batalkan</button>}
              {dirty && <span className="text-xs text-amber-600">Ada perubahan yang belum disimpan</span>}
            </div>
          </form>
        )}

        {/* Keamanan */}
        {tab === "keamanan" && (
          <form onSubmit={simpanPw} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-navy">Ganti Kata Sandi</h3>
            <p className="mb-5 mt-1 text-sm text-slate-500">Gunakan kata sandi yang kuat dan tidak dipakai di tempat lain.</p>
            {[["lama", "Kata Sandi Lama"], ["baru", "Kata Sandi Baru"], ["konf", "Konfirmasi Kata Sandi Baru"]].map(([k, label]) => (
              <div key={k} className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
                <div className="relative">
                  <input type={lihat[k] ? "text" : "password"} className={`${inputCls} pr-11`} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} autoComplete={k === "lama" ? "current-password" : "new-password"} />
                  <button type="button" onClick={() => setLihat({ ...lihat, [k]: !lihat[k] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy" aria-label="Tampilkan/sembunyikan">
                    {lihat[k] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {k === "baru" && pw.baru && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= kuat.skor ? (kuat.skor <= 1 ? "bg-rose-500" : kuat.skor <= 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`} />)}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Kekuatan: <b>{kuat.skor <= 1 ? "Lemah" : kuat.skor <= 2 ? "Sedang" : "Kuat"}</b></p>
                  </div>
                )}
                {k === "konf" && pw.konf && (
                  <p className={`mt-1.5 flex items-center gap-1 text-xs ${cocok ? "text-emerald-600" : "text-rose-600"}`}>
                    {cocok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} {cocok ? "Kata sandi cocok" : "Belum sama dengan kata sandi baru"}
                  </p>
                )}
              </div>
            ))}
            <ul className="mb-4 space-y-1 text-xs text-slate-500">
              {["Minimal 8 karakter", "Kombinasi huruf besar dan kecil", "Mengandung angka", "Simbol atau minimal 12 karakter"].map((t, i) => (
                <li key={t} className={`flex items-center gap-1.5 ${pw.baru && kuat.aturan[i] ? "text-emerald-600" : ""}`}>
                  {pw.baru && kuat.aturan[i] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />} {t}
                </li>
              ))}
            </ul>
            {errPw && <p className="mb-4 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errPw}</p>}
            <button type="submit" disabled={!pwOk || savingPw} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#223357] disabled:cursor-not-allowed disabled:opacity-40">
              {savingPw ? "Menyimpan..." : "Ganti Kata Sandi"}
            </button>
          </form>
        )}

        {/* Riwayat kelas */}
        {tab === "kelas" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {kelasList.length === 0 && <p className="p-8 text-center text-sm text-slate-400">Kamu belum terdaftar di kelas manapun.</p>}
            {kelasList.map((k) => {
              const [label, badge, dot] = STATUS[k.status] || STATUS.PROSES;
              return (
                <Link key={k.id} href="/portal#kelas-saya" className="flex items-center gap-4 rounded-xl p-4 transition hover:bg-slate-50">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy"><BookOpen className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{k.nama}</p>
                    <p className="text-xs text-slate-500">{k.batch}{k.nilai != null && ` · Nilai ${k.nilai}`}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-emerald-600" : "bg-rose-600"}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {toast.msg}
        </div>
      )}
    </div>
  );
}
