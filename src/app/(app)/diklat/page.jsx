import { prisma } from "@/lib/prisma";
import DiklatManager from "@/components/crud/DiklatManager";

export const dynamic = "force-dynamic";

export default async function DiklatListPage() {
  const list = await prisma.judulDiklat.findMany({
    include: { _count: { select: { kelas: true, materi: true } } },
    orderBy: { createdAt: "desc" },
  });
  return <DiklatManager list={list} />;
}
