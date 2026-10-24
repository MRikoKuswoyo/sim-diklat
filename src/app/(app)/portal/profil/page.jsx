import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfilPeserta from "@/components/ProfilPeserta";
import FotoProfil from "@/components/FotoProfil";

export default async function PortalProfilPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session?.pesertaId) {
    const akunAdmin = session?.sub
      ? await prisma.user.findUnique({ where: { id: session.sub }, select: { fotoUrl: true } }).catch(() => null)
      : null;
    return (
      <div>
        <h1 className="mb-3 font-serif text-2xl font-semibold text-navy">Profil Saya</h1>
        <FotoProfil nama={session?.nama} fotoUrl={akunAdmin?.fotoUrl} />
        <p className="text-sm text-slate-500">Akun ini belum terhubung ke data Peserta manapun.</p>
      </div>
    );
  }

  const peserta = await prisma.peserta.findUnique({ where: { id: session.pesertaId } });
  const akun = await prisma.user.findUnique({ where: { id: session.sub }, select: { fotoUrl: true } }).catch(() => null);

  const pendaftaran = await prisma.pendaftaranPeserta.findMany({
    where: { pesertaId: session.pesertaId },
    include: { kelas: { include: { judulDiklat: true } } },
    orderBy: { kelas: { tanggalMulai: "desc" } },
  });
  const stats = {
    kelas: pendaftaran.length,
    lulus: pendaftaran.filter((pd) => pd.statusKelulusan === "LULUS").length,
    sertifikat: pendaftaran.filter((pd) => pd.sertifikatUrl).length,
  };
  const kelasList = pendaftaran.map((pd) => ({
    id: pd.id, nama: pd.kelas.judulDiklat.nama, batch: pd.kelas.namaBatch,
    status: pd.statusKelulusan, nilai: pd.nilai != null ? Number(pd.nilai) : null,
  }));

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-semibold text-navy">Profil Saya</h1>
      <p className="mb-6 text-sm text-slate-500">Data diri dan pengaturan akun kamu.</p>

      <ProfilPeserta
        nama={peserta.nama}
        email={peserta.email}
        nipNik={peserta.nipNik}
        instansi={peserta.instansi}
        fotoUrl={akun?.fotoUrl}
        bergabung={peserta.createdAt ? peserta.createdAt.toISOString() : null}
        stats={stats}
        kelasList={kelasList}
      />
    </div>
  );
}
