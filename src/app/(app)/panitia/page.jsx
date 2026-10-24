import { prisma } from "@/lib/prisma";
import PanitiaManager from "@/components/crud/PanitiaManager";

export const dynamic = "force-dynamic";

export default async function PanitiaListPage() {
  const list = await prisma.panitia.findMany({ include: { _count: { select: { panitiaKelas: true } } }, orderBy: { nama: "asc" } });
  return <PanitiaManager list={list} />;
}
