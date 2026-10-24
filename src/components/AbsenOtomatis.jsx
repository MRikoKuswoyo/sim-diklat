"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

// Dipakai halaman /absen/<kode>: langsung mencatat hadir begitu dibuka (hasil pemindaian QR)
export default function AbsenOtomatis({ kode }) {
  const [hasil, setHasil] = useState(null);
  const jalan = useRef(false);

  useEffect(() => {
    if (jalan.current) return;
    jalan.current = true;
    fetch("/api/portal/absen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kode }) })
      .then(async (r) => setHasil({ ok: r.ok, ...(await r.json().catch(() => ({ error: "Respons tidak dikenal." }))) }))
      .catch(() => setHasil({ ok: false, error: "Tidak bisa terhubung ke server." }));
  }, [kode]);

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {!hasil && (<><Loader2 className="mx-auto h-12 w-12 animate-spin text-slate-400" /><p className="mt-4 text-sm text-slate-500">Mencatat kehadiran...</p></>)}
      {hasil?.ok && (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-3 font-serif text-xl font-semibold text-emerald-700">{hasil.sudah ? "Kamu sudah tercatat hadir" : "Absen berhasil"}</h1>
          <p className="mt-2 text-sm font-medium text-slate-800">{hasil.judul}</p>
          <p className="text-sm text-slate-500">{hasil.diklat} · {hasil.jam} WIB</p>
        </>
      )}
      {hasil && !hasil.ok && (
        <>
          <XCircle className="mx-auto h-16 w-16 text-rose-500" />
          <h1 className="mt-3 font-serif text-xl font-semibold text-rose-700">Absen gagal</h1>
          <p className="mt-2 text-sm text-slate-600">{hasil.error}</p>
        </>
      )}
      <Link href="/portal" className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white">Ke Portal</Link>
    </div>
  );
}
