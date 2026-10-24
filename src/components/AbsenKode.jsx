"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Kolom ketik kode absen di Portal
export default function AbsenKode() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [pesan, setPesan] = useState(null);
  const [loading, setLoading] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setLoading(true); setPesan(null);
    const res = await fetch("/api/portal/absen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kode }) });
    const d = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) return setPesan({ ok: false, teks: d?.error || "Gagal mencatat absen." });
    setPesan({ ok: true, teks: d.sudah ? "Kamu sudah tercatat hadir di sesi ini." : `Absen berhasil: ${d.judul}.` });
    setKode("");
    router.refresh();
  }

  return (
    <form onSubmit={kirim} className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={kode} onChange={(e) => setKode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={6} placeholder="KODE ABSEN"
          className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.3em] outline-none focus:border-navy focus:ring-4 focus:ring-navy/10" />
        <button disabled={kode.length !== 6 || loading} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">
          {loading ? "Memeriksa..." : "Absen Sekarang"}
        </button>
      </div>
      {pesan && <p className={`mt-2 text-sm ${pesan.ok ? "text-emerald-700" : "text-rose-600"}`}>{pesan.teks}</p>}
    </form>
  );
}
