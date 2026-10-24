import VerifikasiShell from "@/components/VerifikasiShell";
import VerifikasiHasil from "@/components/VerifikasiHasil";
import { cariSertifikat } from "@/lib/verifikasi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Sertifikat", robots: { index: false } };

// /verifikasi  (form cek nomor)  —  /verifikasi?nomor=SERT/CODE-001/2026/0001
export default async function VerifikasiPage({ searchParams }) {
  const nomor = String(searchParams?.nomor || "").trim();
  const hasil = nomor ? await cariSertifikat(nomor) : undefined;
  return (
    <VerifikasiShell>
      <form method="GET" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="nomor" className="mb-1.5 block text-sm font-medium text-slate-700">Nomor Sertifikat</label>
        <input id="nomor" name="nomor" defaultValue={nomor} placeholder="SERT/CODE-001/2026/0001" required
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-navy focus:ring-4 focus:ring-navy/10" />
        <button className="mt-3 w-full rounded-lg bg-navy py-2.5 text-sm font-medium text-white hover:bg-[#223357]">Periksa</button>
        <p className="mt-3 text-xs text-slate-400">Nomor tertera pada sertifikat. Anda juga bisa memindai kode QR di sertifikat.</p>
      </form>
      {hasil !== undefined && <div className="mt-5"><VerifikasiHasil hasil={hasil} /></div>}
    </VerifikasiShell>
  );
}
