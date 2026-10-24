import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const ADMIN_PREFIXES = ["/dashboard", "/diklat", "/materi", "/kelas", "/narasumber", "/panitia", "/peserta", "/pengaturan", "/pengumuman", "/laporan"];
const USER_PREFIXES = ["/portal"];
const LOGIN_ONLY_PREFIXES = ["/pilih", "/absen"]; // halaman pilihan Moodle / Dashboard (semua role)

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isUserRoute = USER_PREFIXES.some((p) => pathname.startsWith(p));
  const isLoginOnlyRoute = LOGIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if ((isAdminRoute || isUserRoute || isLoginOnlyRoute) && !session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname.startsWith("/absen")) loginUrl.searchParams.set("next", pathname); // kembali ke halaman absen setelah login
    return NextResponse.redirect(loginUrl);
  }
  // Admin boleh intip Portal juga; User biasa tidak boleh ke rute admin.
  if (isAdminRoute && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/diklat/:path*",
    "/materi/:path*",
    "/kelas/:path*",
    "/narasumber/:path*",
    "/panitia/:path*",
    "/peserta/:path*",
    "/pengaturan/:path*",
    "/pengumuman/:path*",
    "/laporan/:path*",
    "/portal/:path*",
    "/pilih",
    "/absen/:path*",
  ],
};
