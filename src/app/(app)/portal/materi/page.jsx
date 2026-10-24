import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PortalMateriPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session?.pesertaId) {
    return (
      <div>
        <h1 className="mb-3 font-serif text-2xl font-semibold text-navy">Materi & Silabus</h1>
        <p className="text-sm text-slate-500">Akun ini belum terhubung ke data Peserta manapun.</p>
      </div>
    );
  }

  const pendaftaran = await prisma.pendaftaranPeserta.findMany({
    where: { pesertaId: session.pesertaId },
    include: { kelas: { include: { judulDiklat: { include: { materi: true } } } } },
    orderBy: { kelas: { tanggalMulai: "desc" } },
  });

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-semibold text-navy">Materi & Silabus</h1>
      <p className="mb-6 text-sm text-slate-500">Semua materi dari kelas diklat yang kamu ikuti.</p>

      {pendaftaran.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Kamu belum terdaftar di Kelas Diklat manapun.
        </p>
      )}

      <div className="space-y-6">
        {pendaftaran.map((pd) => {
          const kelas = pd.kelas;
          return (
            <section key={pd.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs text-slate-400">{kelas.judulDiklat.kode} · {kelas.namaBatch}</p>
              <p className="mb-3 font-serif font-semibold text-navy">{kelas.judulDiklat.nama}</p>

              {kelas.judulDiklat.materi.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada materi untuk diklat ini.</p>
              ) : (
                <div className="space-y-2">
                  {kelas.judulDiklat.materi.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{m.judulMateri}</p>
                        <p className="text-xs text-slate-400">{m.durasiJp} JP</p>
                      </div>
                      {m.fileSilabusUrl ? (
                        <a href={m.fileSilabusUrl} target="_blank" rel="noopener noreferrer"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                          Unduh Silabus
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">Silabus belum diunggah</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
