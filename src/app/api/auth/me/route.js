import { NextResponse } from "next/server";
import { getSession } from "@/lib/apiAuth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { nama: session.nama, email: session.email, role: session.role },
  });
}
