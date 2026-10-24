import { prisma } from "@/lib/prisma";
import NarasumberManager from "@/components/crud/NarasumberManager";

export const dynamic = "force-dynamic";

export default async function NarasumberListPage() {
  const list = await prisma.narasumber.findMany({ include: { _count: { select: { pengajarKelas: true } } }, orderBy: { nama: "asc" } });
  return <NarasumberManager list={list} />;
}
