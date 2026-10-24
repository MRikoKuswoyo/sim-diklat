import { prisma } from "@/lib/prisma";
import MateriManager from "@/components/crud/MateriManager";

export const dynamic = "force-dynamic";

export default async function MateriListPage({ searchParams }) {
  const [list, diklatOptions] = await Promise.all([
    prisma.materiDiklat.findMany({ orderBy: { judulMateri: "asc" } }),
    prisma.judulDiklat.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
  ]);
  const awal = diklatOptions.some((d) => d.id === searchParams?.diklat) ? searchParams.diklat : "";
  return <MateriManager list={list} diklatOptions={diklatOptions} awalFilter={awal} />;
}
