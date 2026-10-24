-- CreateTable
CREATE TABLE `notifikasi` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `isi` TEXT NOT NULL,
    `tautan` VARCHAR(191) NULL,
    `dibaca` BOOLEAN NOT NULL DEFAULT false,
    `kunci` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_user_id_dibaca_idx`(`user_id`, `dibaca`),
    UNIQUE INDEX `notifikasi_user_id_kunci_key`(`user_id`, `kunci`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
