import { prisma } from "@/lib/prisma";
import PesertaManager from "@/components/crud/PesertaManager";

export const dynamic = "force-dynamic";

export default async function PesertaListPage() {
  const list = await prisma.peserta.findMany({
    include: { _count: { select: { pendaftaran: true } }, user: { select: { id: true } } },
    orderBy: { nama: "asc" },
  });
  return <PesertaManager list={list.map(({ user, ...p }) => ({ ...p, punyaAkun: !!user }))} />;
}
