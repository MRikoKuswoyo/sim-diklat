import { NextResponse } from "next/server";
import { getSession } from "@/lib/apiAuth";
import { moodleConfig, isMoodleSsoEnabled, requestAutoLoginUrl } from "@/lib/moodle";

export const dynamic = "force-dynamic";

// GET /api/moodle/launch — dipanggil saat user klik tombol "Moodle".
// Token web service TIDAK pernah dikirim ke browser; semua dilakukan di server.
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const { url } = moodleConfig();
  if (!url) return NextResponse.redirect(new URL("/pilih?error=belum-dikonfigurasi", request.url));

  // Mode sederhana: belum ada token -> buka Moodle apa adanya
  if (!isMoodleSsoEnabled()) return NextResponse.redirect(url);

  try {
    const loginUrl = await requestAutoLoginUrl({ email: session.email, nama: session.nama });
    return NextResponse.redirect(loginUrl);
  } catch (err) {
    console.error("[moodle] auto-login gagal:", err.message);
    return NextResponse.redirect(new URL("/pilih?error=moodle-gagal", request.url));
  }
}
