-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `logo_url` VARCHAR(191) NULL,
    `nama_aplikasi` VARCHAR(191) NOT NULL DEFAULT 'SIM Diklat',
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
