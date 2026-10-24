import { BadgeCheck, ShieldX } from "lucide-react";

const tgl = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function VerifikasiHasil({ hasil }) {
  if (!hasil) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <ShieldX className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-3 font-serif text-lg font-semibold text-rose-700">Sertifikat tidak ditemukan</h2>
        <p className="mt-1 text-sm text-slate-500">Nomor atau kode ini tidak terdaftar sebagai sertifikat yang sah. Periksa kembali penulisannya, atau hubungi penyelenggara diklat.</p>
      </div>
    );
  }
  const baris = [
    ["Nama Peserta", hasil.nama],
    ["Diklat", hasil.diklat],
    ["Angkatan / Batch", hasil.batch],
    ["Pelaksanaan", `${tgl(hasil.mulai)} – ${tgl(hasil.selesai)}`],
    ["Total Jam Pelajaran", `${hasil.totalJp} JP`],
    ...(hasil.nomor ? [["Nomor Sertifikat", hasil.nomor]] : []),
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
      <div className="bg-emerald-50 p-6 text-center">
        <BadgeCheck className="mx-auto h-14 w-14 text-emerald-600" />
        <h2 className="mt-2 font-serif text-xl font-semibold text-emerald-800">Sertifikat Terverifikasi</h2>
        <p className="text-sm text-emerald-700">Peserta ini dinyatakan lulus pada diklat berikut.</p>
      </div>
      <dl className="divide-y divide-slate-100 px-6">
        {baris.map(([label, nilai]) => (
          <div key={label} className="grid grid-cols-[9rem,1fr] gap-3 py-3 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className={`font-medium text-slate-800 ${label === "Nomor Sertifikat" ? "break-all font-mono text-xs" : ""}`}>{nilai}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
