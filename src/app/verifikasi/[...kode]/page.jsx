import VerifikasiShell from "@/components/VerifikasiShell";
import VerifikasiHasil from "@/components/VerifikasiHasil";
import { cariSertifikat, kodeDariSegmen } from "@/lib/verifikasi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Sertifikat", robots: { index: false } };

// /verifikasi/<id pendaftaran dari QR>  atau  /verifikasi/SERT/CODE-001/2026/0001
export default async function VerifikasiKodePage({ params }) {
  const hasil = await cariSertifikat(kodeDariSegmen(params.kode));
  return (
    <VerifikasiShell>
      <VerifikasiHasil hasil={hasil} />
      <a href="/verifikasi" className="mt-4 block text-center text-sm text-slate-500 underline hover:text-slate-700">Cek nomor sertifikat lain</a>
    </VerifikasiShell>
  );
}
