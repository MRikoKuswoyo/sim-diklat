-- AlterTable
ALTER TABLE `kelas_diklat` ADD COLUMN `kehadiran_minimal` INTEGER NOT NULL DEFAULT 80,
    ADD COLUMN `nilai_minimal` INTEGER NOT NULL DEFAULT 70;

-- CreateTable
CREATE TABLE `komponen_nilai` (
    `id` VARCHAR(191) NOT NULL,
    `kelas_id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `bobot` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nilai_komponen` (
    `id` VARCHAR(191) NOT NULL,
    `komponen_id` VARCHAR(191) NOT NULL,
    `peserta_id` VARCHAR(191) NOT NULL,
    `nilai` DOUBLE NOT NULL,

    UNIQUE INDEX `nilai_komponen_komponen_id_peserta_id_key`(`komponen_id`, `peserta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `komponen_nilai` ADD CONSTRAINT `komponen_nilai_kelas_id_fkey` FOREIGN KEY (`kelas_id`) REFERENCES `kelas_diklat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_komponen` ADD CONSTRAINT `nilai_komponen_komponen_id_fkey` FOREIGN KEY (`komponen_id`) REFERENCES `komponen_nilai`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nilai_komponen` ADD CONSTRAINT `nilai_komponen_peserta_id_fkey` FOREIGN KEY (`peserta_id`) REFERENCES `peserta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
