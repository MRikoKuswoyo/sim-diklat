import { syncStatusKelas } from "@/lib/kelasStatus";
import { getSession } from "@/lib/apiAuth";
import { muatDashboard } from "@/lib/dashboard";
import DashboardAdmin from "@/components/DashboardAdmin";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await syncStatusKelas();
  const [session, data] = await Promise.all([getSession(), muatDashboard()]);
  return <DashboardAdmin nama={session?.nama || "Admin"} data={data} />;
}
