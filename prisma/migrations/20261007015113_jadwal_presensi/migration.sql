-- CreateTable
CREATE TABLE `sesi_kelas` (
    `id` VARCHAR(191) NOT NULL,
    `kelas_id` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `jam_mulai` VARCHAR(191) NOT NULL,
    `jam_selesai` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presensi` (
    `id` VARCHAR(191) NOT NULL,
    `sesi_id` VARCHAR(191) NOT NULL,
    `peserta_id` VARCHAR(191) NOT NULL,
    `status` ENUM('HADIR', 'IZIN', 'SAKIT', 'ALPA') NOT NULL,

    UNIQUE INDEX `presensi_sesi_id_peserta_id_key`(`sesi_id`, `peserta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sesi_kelas` ADD CONSTRAINT `sesi_kelas_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas_diklat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presensi` ADD CONSTRAINT `presensi_sesi_id_fkey` FOREIGN KEY (`sesi_id`) REFERENCES `sesi_kelas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presensi` ADD CONSTRAINT `presensi_peserta_id_fkey` FOREIGN KEY (`peserta_id`) REFERENCES `peserta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
