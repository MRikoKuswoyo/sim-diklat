// Helper untuk API routes (Node runtime): baca session dari cookie,
// dan tolak akses jika bukan Admin.
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}
