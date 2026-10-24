import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatTanggal(date) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function PortalSertifikatPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session?.pesertaId) {
    return (
      <div>
        <h1 className="mb-3 font-serif text-2xl font-semibold text-navy">Sertifikat</h1>
        <p className="text-sm text-slate-500">Akun ini belum terhubung ke data Peserta manapun.</p>
      </div>
    );
  }

  const pendaftaran = await prisma.pendaftaranPeserta.findMany({
    where: { pesertaId: session.pesertaId },
    include: { kelas: { include: { judulDiklat: true } } },
    orderBy: { kelas: { tanggalMulai: "desc" } },
  });

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-semibold text-navy">Sertifikat</h1>
      <p className="mb-6 text-sm text-slate-500">Sertifikat dari kelas diklat yang sudah kamu selesaikan.</p>

      {pendaftaran.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Kamu belum terdaftar di Kelas Diklat manapun.
        </p>
      )}

      <div className="space-y-3">
        {pendaftaran.map((pd) => {
          const kelas = pd.kelas;
          return (
            <div key={pd.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs text-slate-400">{kelas.judulDiklat.kode} · {kelas.namaBatch}</p>
                <p className="font-serif font-semibold text-navy">{kelas.judulDiklat.nama}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatTanggal(kelas.tanggalMulai)} – {formatTanggal(kelas.tanggalSelesai)}
                </p>
                {pd.sertifikatUrl && pd.nomorSertifikat && (
                  <p className="mt-1 font-mono text-xs text-slate-500">No. {pd.nomorSertifikat}</p>
                )}
              </div>

              {pd.statusKelulusan === "LULUS" ? (
                pd.sertifikatUrl ? (
                  <a href={pd.sertifikatUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-[#223357]">
                    Unduh Sertifikat
                  </a>
                ) : (
                  <p className="max-w-[220px] text-sm text-slate-500">Lulus — sertifikat sedang diproses admin.</p>
                )
              ) : pd.statusKelulusan === "PROSES" ? (
                <p className="max-w-[220px] text-sm text-slate-500">Tersedia setelah kelas selesai & dinyatakan lulus.</p>
              ) : (
                <p className="max-w-[220px] text-sm text-slate-500">Belum memenuhi syarat kelulusan.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
