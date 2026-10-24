"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QrPopup from "@/components/QrPopup";

export default function SertifikatCell({ kelasId, p }) {
  const router = useRouter();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(false);
  const [error, setError] = useState("");
  const base = `/api/kelas/${kelasId}/peserta/${p.id}/sertifikat`;

  if (p.statusKelulusan !== "LULUS") return <span className="text-slate-300">—</span>;

  async function unggah(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(base, { method: "POST", body: fd });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(data?.error || `Gagal (HTTP ${res.status}).`);
    router.refresh();
  }
  async function hapus() {
    if (!confirm("Hapus file sertifikat peserta ini?")) return;
    setBusy(true);
    await fetch(base, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="text-xs">
      {p.sertifikatUrl && p.nomorSertifikat && <p className="font-mono text-[11px] text-slate-500">{p.nomorSertifikat}</p>}
      <div className="mt-0.5 flex items-center gap-2">
        {p.sertifikatUrl && <a href={p.sertifikatUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#B8892B] underline">Lihat</a>}
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="font-medium text-[#16233F] underline disabled:opacity-50">
          {busy ? "Memproses..." : p.sertifikatUrl ? "Ganti" : "Unggah PDF"}
        </button>
        {p.sertifikatUrl && !busy && <button type="button" onClick={hapus} className="font-medium text-rose-600 underline">Hapus</button>}
        <button type="button" onClick={() => setQr(true)} title="Lihat kode QR verifikasi untuk ditempel di sertifikat" className="font-medium text-slate-500 underline">QR</button>
      </div>
      {error && <p className="mt-1 text-rose-600">{error}</p>}
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={unggah} />
      {qr && (
        <QrPopup
          judul="QR Verifikasi Sertifikat"
          subjudul={p.nama}
          src={`${base}/qr`}
          catatan="Tempel QR ini ke desain sertifikat. Saat dipindai, muncul halaman verifikasi keaslian."
          unduhHref={`${base}/qr`}
          unduhNama={`QR-verifikasi-${String(p.nama || "peserta").replace(/\s+/g, "-")}.png`}
          onClose={() => setQr(false)}
        />
      )}
    </div>
  );
}
