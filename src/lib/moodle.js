// Integrasi Moodle — hanya dipakai di server (API route / server component).
//
// Dua mode, ditentukan oleh isi .env:
//  - MOODLE_URL saja            -> tombol Moodle membuka Moodle biasa (user login di Moodle).
//  - MOODLE_URL + MOODLE_WS_TOKEN -> masuk OTOMATIS (SSO) lewat plugin "auth_userkey".
//
// Pencocokan akun: email user SIM Diklat == email akun Moodle.
// Kalau email itu belum punya akun di Moodle, akun dibuat otomatis (nama diambil dari SIM Diklat).
// Syarat: skrip admin/cli/sim_diklat_sso.php sudah dijalankan di Moodle (opsi createuser aktif).

export function moodleConfig() {
  return {
    url: (process.env.MOODLE_URL || "").trim().replace(/\/+$/, ""),
    token: (process.env.MOODLE_WS_TOKEN || "").trim(),
  };
}

export function isMoodleConfigured() {
  return !!moodleConfig().url;
}

export function isMoodleSsoEnabled() {
  const { url, token } = moodleConfig();
  return !!(url && token);
}

// "Budi Santoso Putra" -> { firstname: "Budi", lastname: "Santoso Putra" }
function pisahNama(nama, email) {
  const bagian = String(nama || "").trim().split(/\s+/).filter(Boolean);
  const firstname = bagian[0] || String(email).split("@")[0];
  const lastname = bagian.slice(1).join(" ") || "-"; // Moodle mewajibkan nama belakang
  return { firstname, lastname };
}

/**
 * Minta URL login sekali-pakai dari Moodle (plugin auth_userkey) untuk satu user.
 * Mengembalikan string URL; melempar Error kalau gagal.
 */
export async function requestAutoLoginUrl({ email, nama }) {
  const { url, token } = moodleConfig();
  const emailBersih = String(email || "").trim().toLowerCase();

  const body = new URLSearchParams({
    wstoken: token,
    wsfunction: "auth_userkey_request_login_url",
    moodlewsrestformat: "json",
    "user[email]": emailBersih,
  });
  // Data untuk membuat akun baru bila belum ada. Set MOODLE_AUTO_CREATE=0 kalau opsi
  // createuser di Moodle dimatikan (Moodle menolak parameter yang tidak dikenal).
  if (process.env.MOODLE_AUTO_CREATE !== "0") {
    const { firstname, lastname } = pisahNama(nama, emailBersih);
    body.set("user[username]", emailBersih);
    body.set("user[firstname]", firstname);
    body.set("user[lastname]", lastname);
  }

  const res = await fetch(`${url}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Moodle membalas HTTP ${res.status}`);

  const data = await res.json();
  // Moodle membalas error web service dengan HTTP 200 + field "exception"/"errorcode"
  if (data?.exception || data?.errorcode) {
    throw new Error(`Moodle: ${data.errorcode || data.exception} — ${data.message || ""}`.trim());
  }
  if (!data?.loginurl) throw new Error("Moodle tidak mengembalikan loginurl.");

  const parsed = new URL(data.loginurl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("loginurl dari Moodle tidak valid.");
  }
  return data.loginurl;
}

async function wsCall(fn, params) {
  const { url, token } = moodleConfig();
  const body = new URLSearchParams({ wstoken: token, wsfunction: fn, moodlewsrestformat: "json", ...params });
  const res = await fetch(`${url}/webservice/rest/server.php`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Moodle membalas HTTP ${res.status}`);
  const data = await res.json();
  if (data?.exception || data?.errorcode) throw new Error(`Moodle: ${data.errorcode || data.exception} — ${data.message || ""}`.trim());
  return data;
}

/** Daftarkan peserta ke kursus Moodle (sebagai Student). Akun Moodle dibuat dulu bila belum ada. */
export async function enrolDiMoodle({ email, nama, courseId }) {
  const emailBersih = String(email).trim().toLowerCase();
  await requestAutoLoginUrl({ email: emailBersih, nama }); // efek samping: membuat akun bila belum ada
  const users = await wsCall("core_user_get_users_by_field", { field: "email", "values[0]": emailBersih });
  const userid = users?.[0]?.id;
  if (!userid) throw new Error("Akun Moodle tidak ditemukan setelah dibuat.");
  await wsCall("enrol_manual_enrol_users", {
    "enrolments[0][roleid]": "5", "enrolments[0][userid]": String(userid), "enrolments[0][courseid]": String(courseId),
  });
}
