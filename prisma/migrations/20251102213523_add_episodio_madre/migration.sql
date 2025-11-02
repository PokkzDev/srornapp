-- CreateTable
CREATE TABLE `EpisodioMadre` (
    `id` CHAR(36) NOT NULL,
    `madreId` CHAR(36) NOT NULL,
    `estado` ENUM('INGRESADO', 'ALTA') NOT NULL DEFAULT 'INGRESADO',
    `fechaIngreso` DATETIME(3) NOT NULL,
    `motivoIngreso` VARCHAR(300) NULL,
    `hospitalAnterior` VARCHAR(200) NULL,
    `fechaAlta` DATETIME(3) NULL,
    `condicionEgreso` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,

    INDEX `EpisodioMadre_madreId_idx`(`madreId`),
    INDEX `EpisodioMadre_estado_idx`(`estado`),
    INDEX `EpisodioMadre_fechaIngreso_idx`(`fechaIngreso`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EpisodioMadre` ADD CONSTRAINT `EpisodioMadre_madreId_fkey` FOREIGN KEY (`madreId`) REFERENCES `Madre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EpisodioMadre` ADD CONSTRAINT `EpisodioMadre_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EpisodioMadre` ADD CONSTRAINT `EpisodioMadre_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
