import { prisma } from "@/lib/prisma";
import PengaturanPanel from "@/components/PengaturanPanel";
import { moodleConfig } from "@/lib/moodle";

export const dynamic = "force-dynamic";

const SECRET_LEMAH = ["dev-secret-change-me", "ganti-dengan-string-acak-panjang", "changeme", "secret"];

// Status sistem untuk panel "Sistem". Tidak pernah mengirim nilai rahasia (token, kata sandi) ke browser.
async function hitungStatus() {
  const jwt = process.env.JWT_SECRET || "";
  const jwtLemah = jwt.length < 32 || SECRET_LEMAH.includes(jwt);
  const { url, token } = moodleConfig();
  const appUrl = process.env.APP_URL || "";
  const lokal = /localhost|127\.0\.0\.1/.test(appUrl);

  let db = { tingkat: "ok", detail: "Terhubung." };
  try { await prisma.$queryRaw`SELECT 1`; } catch { db = { tingkat: "warn", detail: "Tidak bisa menjalankan query." }; }

  return [
    { id: "db", label: "Database", ...db, saran: null },
    { id: "jwt", label: "Keamanan login (JWT_SECRET)", tingkat: jwtLemah ? "warn" : "ok", detail: jwtLemah ? "Kunci masih contoh atau terlalu pendek." : "Kunci kuat.", saran: jwtLemah ? "Buat kunci acak minimal 32 karakter dan isi di .env." : null },
    { id: "moodle", label: "Integrasi Moodle", tingkat: !url ? "off" : token ? "ok" : "warn", detail: !url ? "MOODLE_URL belum diisi." : token ? `Masuk otomatis aktif ke ${url}.` : `Terhubung ke ${url}, tetapi masuk otomatis belum aktif.`, saran: !url ? "Isi MOODLE_URL di .env." : token ? null : "Jalankan pasang-sso.bat lalu isi MOODLE_WS_TOKEN." },
    { id: "email", label: "Email notifikasi", tingkat: process.env.SMTP_HOST ? "ok" : "off", detail: process.env.SMTP_HOST ? `Email dikirim lewat ${process.env.SMTP_HOST}.` : "Tidak aktif. Notifikasi hanya tampil di lonceng aplikasi.", saran: process.env.SMTP_HOST ? null : "Opsional: isi SMTP_* di .env." },
    { id: "appurl", label: "Alamat aplikasi (APP_URL)", tingkat: !appUrl ? "warn" : lokal ? "warn" : "ok", detail: !appUrl ? "Belum diisi; QR memakai alamat yang sedang dibuka." : lokal ? `${appUrl} hanya bisa dibuka dari komputer ini.` : appUrl, saran: !appUrl || lokal ? "Isi alamat yang bisa dibuka HP peserta agar QR absen bisa dipindai." : null },
  ];
}

export default async function PengaturanPage() {
  const [settings, status] = await Promise.all([prisma.settings.findUnique({ where: { id: "singleton" } }), hitungStatus()]);
  return (
    <PengaturanPanel
      awal={{ logoUrl: settings?.logoUrl || "", backgroundUrl: settings?.backgroundUrl || "", namaAplikasi: settings?.namaAplikasi || "SIM Diklat" }}
      status={status}
      info={{ mode: process.env.NODE_ENV === "production" ? "Produksi" : "Pengembangan", node: process.version }}
    />
  );
}
