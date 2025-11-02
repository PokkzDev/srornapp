/*
  Warnings:

  - You are about to drop the column `matronaId` on the `parto` table. All the data in the column will be lost.
  - You are about to drop the column `medicoId` on the `parto` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `parto` DROP FOREIGN KEY `Parto_matronaId_fkey`;

-- DropForeignKey
ALTER TABLE `parto` DROP FOREIGN KEY `Parto_medicoId_fkey`;

-- DropIndex
DROP INDEX `Parto_matronaId_fkey` ON `parto`;

-- DropIndex
DROP INDEX `Parto_medicoId_fkey` ON `parto`;

-- AlterTable
ALTER TABLE `parto` DROP COLUMN `matronaId`,
    DROP COLUMN `medicoId`;

-- CreateTable
CREATE TABLE `PartoMatrona` (
    `partoId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartoMatrona_partoId_idx`(`partoId`),
    INDEX `PartoMatrona_userId_idx`(`userId`),
    PRIMARY KEY (`partoId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartoMedico` (
    `partoId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartoMedico_partoId_idx`(`partoId`),
    INDEX `PartoMedico_userId_idx`(`userId`),
    PRIMARY KEY (`partoId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartoEnfermera` (
    `partoId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartoEnfermera_partoId_idx`(`partoId`),
    INDEX `PartoEnfermera_userId_idx`(`userId`),
    PRIMARY KEY (`partoId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PartoMatrona` ADD CONSTRAINT `PartoMatrona_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartoMatrona` ADD CONSTRAINT `PartoMatrona_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartoMedico` ADD CONSTRAINT `PartoMedico_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartoMedico` ADD CONSTRAINT `PartoMedico_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartoEnfermera` ADD CONSTRAINT `PartoEnfermera_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartoEnfermera` ADD CONSTRAINT `PartoEnfermera_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
