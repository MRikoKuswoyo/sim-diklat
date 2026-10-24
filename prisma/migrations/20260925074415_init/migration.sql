-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `peserta_id` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_peserta_id_key`(`peserta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `judul_diklat` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `deskripsi` TEXT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `status` ENUM('AKTIF', 'DRAFT', 'SELESAI') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `judul_diklat_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materi_diklat` (
    `id` VARCHAR(191) NOT NULL,
    `judul_diklat_id` VARCHAR(191) NOT NULL,
    `judulMateri` VARCHAR(191) NOT NULL,
    `file_silabus_url` VARCHAR(191) NULL,
    `durasi_jp` INTEGER NOT NULL,
    `deskripsi` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kelas_diklat` (
    `id` VARCHAR(191) NOT NULL,
    `judul_diklat_id` VARCHAR(191) NOT NULL,
    `nama_batch` VARCHAR(191) NOT NULL,
    `tanggal_mulai` DATETIME(3) NOT NULL,
    `tanggal_selesai` DATETIME(3) NOT NULL,
    `lokasi_atau_link` VARCHAR(191) NOT NULL,
    `kuota` INTEGER NOT NULL,
    `status` ENUM('PERSIAPAN', 'BERJALAN', 'SELESAI') NOT NULL DEFAULT 'PERSIAPAN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peserta` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `nip_nik` VARCHAR(191) NOT NULL,
    `instansi` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `peserta_nip_nik_key`(`nip_nik`),
    UNIQUE INDEX `peserta_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pendaftaran_peserta` (
    `id` VARCHAR(191) NOT NULL,
    `kelas_id` VARCHAR(191) NOT NULL,
    `peserta_id` VARCHAR(191) NOT NULL,
    `nilai` DECIMAL(5, 2) NULL,
    `status_kelulusan` ENUM('PROSES', 'LULUS', 'TIDAK_LULUS') NOT NULL DEFAULT 'PROSES',
    `sertifikat_url` VARCHAR(191) NULL,
    `tanggal_daftar` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pendaftaran_peserta_kelas_id_peserta_id_key`(`kelas_id`, `peserta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `narasumber` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kepakaran` VARCHAR(191) NOT NULL,
    `kontak` VARCHAR(191) NOT NULL,
    `instansi_asal` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajar_kelas` (
    `id` VARCHAR(191) NOT NULL,
    `kelas_id` VARCHAR(191) NOT NULL,
    `narasumber_id` VARCHAR(191) NOT NULL,
    `materi_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `pengajar_kelas_kelas_id_narasumber_id_materi_id_key`(`kelas_id`, `narasumber_id`, `materi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panitia` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kontak` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panitia_kelas` (
    `id` VARCHAR(191) NOT NULL,
    `kelas_id` VARCHAR(191) NOT NULL,
    `panitia_id` VARCHAR(191) NOT NULL,
    `peran_pj` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `panitia_kelas_kelas_id_panitia_id_key`(`kelas_id`, `panitia_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_peserta_id_fkey` FOREIGN KEY (`peserta_id`) REFERENCES `peserta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materi_diklat` ADD CONSTRAINT `materi_diklat_judul_diklat_id_fkey` FOREIGN KEY (`judul_diklat_id`) REFERENCES `judul_diklat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kelas_diklat` ADD CONSTRAINT `kelas_diklat_judul_diklat_id_fkey` FOREIGN KEY (`judul_diklat_id`) REFERENCES `judul_diklat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pendaftaran_peserta` ADD CONSTRAINT `pendaftaran_peserta_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas_diklat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pendaftaran_peserta` ADD CONSTRAINT `pendaftaran_peserta_peserta_id_fkey` FOREIGN KEY (`peserta_id`) REFERENCES `peserta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajar_kelas` ADD CONSTRAINT `pengajar_kelas_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas_diklat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajar_kelas` ADD CONSTRAINT `pengajar_kelas_narasumber_id_fkey` FOREIGN KEY (`narasumber_id`) REFERENCES `narasumber`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajar_kelas` ADD CONSTRAINT `pengajar_kelas_materi_id_fkey` FOREIGN KEY (`materi_id`) REFERENCES `materi_diklat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `panitia_kelas` ADD CONSTRAINT `panitia_kelas_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas_diklat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `panitia_kelas` ADD CONSTRAINT `panitia_kelas_panitia_id_fkey` FOREIGN KEY (`panitia_id`) REFERENCES `panitia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
