import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { moodleConfig } from "@/lib/moodle";

export const dynamic = "force-dynamic";

// POST: periksa apakah Moodle bisa dijangkau dan token web service valid (tidak membuat/mengubah data apa pun)
export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const { url, token } = moodleConfig();
  if (!url) return NextResponse.json({ ok: false, pesan: "MOODLE_URL belum diisi di file .env." });

  const mulai = Date.now();
  try {
    const res = await fetch(`${url}/login/index.php`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) return NextResponse.json({ ok: false, pesan: `Moodle membalas HTTP ${res.status}. Periksa MOODLE_URL.` });
  } catch {
    return NextResponse.json({ ok: false, pesan: `Moodle tidak bisa dijangkau di ${url}. Pastikan Moodle sedang berjalan dan alamatnya benar.` });
  }
  const ms = Date.now() - mulai;
  if (!token) return NextResponse.json({ ok: true, tingkat: "warn", pesan: `Moodle terjangkau (${ms} ms), tetapi MOODLE_WS_TOKEN belum diisi, jadi masuk otomatis belum aktif.` });

  // Uji token: "invalidtoken" = salah; "accessexception" = token sah (fungsi ini memang tidak diizinkan di service).
  try {
    const body = new URLSearchParams({ wstoken: token, wsfunction: "core_webservice_get_site_info", moodlewsrestformat: "json" });
    const r = await fetch(`${url}/webservice/rest/server.php`, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(6000) });
    const d = await r.json();
    if (d?.errorcode === "invalidtoken") return NextResponse.json({ ok: false, pesan: "Moodle terjangkau, tetapi token web service tidak valid. Jalankan ulang pasang-sso.bat dan salin tokennya." });
    return NextResponse.json({ ok: true, tingkat: "ok", pesan: `Terhubung (${ms} ms). Token web service valid, masuk otomatis ke Moodle siap dipakai.` });
  } catch {
    return NextResponse.json({ ok: false, pesan: "Moodle terjangkau, tetapi web service tidak merespons. Pastikan web services aktif di Moodle." });
  }
}
