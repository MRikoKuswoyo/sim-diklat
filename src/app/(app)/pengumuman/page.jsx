import { prisma } from "@/lib/prisma";
import PengumumanManager from "@/components/PengumumanManager";

export const dynamic = "force-dynamic";

export default async function PengumumanPage() {
  const list = await prisma.pengumuman.findMany({ orderBy: { createdAt: "desc" } });
  return <PengumumanManager list={list.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))} />;
}
