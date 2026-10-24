// prisma/seed.ts
// Membuat 2 akun demo: 1 Admin, 1 User (terhubung ke data Peserta).
//
// Setup:
//   npm install bcryptjs
//   npm install -D tsx
// Tambahkan di package.json:
//   "prisma": { "seed": "tsx prisma/seed.ts" }
// Jalankan:
//   npx prisma db seed
//
// ⚠️ Ganti password default di bawah sebelum dipakai di lingkungan production.

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---------------------------------------------------------------
  // 1. Akun ADMIN — akses penuh ke seluruh menu manajemen
  // ---------------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@diklat.go.id" },
    update: {},
    create: {
      nama: "Admin Diklat",
      email: "admin@diklat.go.id",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  // ---------------------------------------------------------------
  // 2. Akun USER — akses terbatas ke Portal Peserta,
  //    terhubung ke satu record Peserta (data yang sama dipakai
  //    di Tab Peserta pada Detail Kelas)
  // ---------------------------------------------------------------
  const peserta = await prisma.peserta.upsert({
    where: { nipNik: "198501012010011001" },
    update: {},
    create: {
      nama: "Andi Saputra",
      nipNik: "198501012010011001",
      instansi: "Pemkot Batam",
      email: "andi.saputra@pemko.go.id",
    },
  });

  const userPasswordHash = await bcrypt.hash("Peserta123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "andi.saputra@pemko.go.id" },
    update: {},
    create: {
      nama: peserta.nama,
      email: peserta.email,
      passwordHash: userPasswordHash,
      role: Role.USER,
      pesertaId: peserta.id,
    },
  });

  console.log("Seed selesai:");
  console.log({ admin: { email: admin.email, role: admin.role } });
  console.log({ user: { email: user.email, role: user.role } });

  // ---------------------------------------------------------------
  // 3. Pengaturan aplikasi (singleton) — logo & nama default,
  //    bisa diubah admin lewat menu Pengaturan.
  // ---------------------------------------------------------------
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", namaAplikasi: "SIM Diklat" },
  });

  console.log("\nKredensial demo (ganti sebelum production):");
  console.log("  Admin → admin@diklat.go.id / Admin123!");
  console.log("  User  → andi.saputra@pemko.go.id / Peserta123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
