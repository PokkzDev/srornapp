/*
  Warnings:

  - The primary key for the `rolepermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `roleId` on the `rolepermission` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `permissionId` on the `rolepermission` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `userpermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `userId` on the `userpermission` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `permissionId` on the `userpermission` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - The primary key for the `userrole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `userId` on the `userrole` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `roleId` on the `userrole` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.

*/
-- DropForeignKey
ALTER TABLE `rolepermission` DROP FOREIGN KEY `RolePermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `rolepermission` DROP FOREIGN KEY `RolePermission_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `userpermission` DROP FOREIGN KEY `UserPermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `userpermission` DROP FOREIGN KEY `UserPermission_userId_fkey`;

-- DropForeignKey
ALTER TABLE `userrole` DROP FOREIGN KEY `UserRole_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `userrole` DROP FOREIGN KEY `UserRole_userId_fkey`;

-- AlterTable
ALTER TABLE `rolepermission` DROP PRIMARY KEY,
    MODIFY `roleId` CHAR(36) NOT NULL,
    MODIFY `permissionId` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`roleId`, `permissionId`);

-- AlterTable
ALTER TABLE `userpermission` DROP PRIMARY KEY,
    MODIFY `userId` CHAR(36) NOT NULL,
    MODIFY `permissionId` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`userId`, `permissionId`);

-- AlterTable
ALTER TABLE `userrole` DROP PRIMARY KEY,
    MODIFY `userId` CHAR(36) NOT NULL,
    MODIFY `roleId` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`userId`, `roleId`);

-- CreateTable
CREATE TABLE `Madre` (
    `id` CHAR(36) NOT NULL,
    `rut` VARCHAR(12) NOT NULL,
    `nombres` VARCHAR(120) NOT NULL,
    `apellidos` VARCHAR(120) NOT NULL,
    `edad` INTEGER NULL,
    `fechaNacimiento` DATETIME(3) NULL,
    `direccion` VARCHAR(200) NULL,
    `telefono` VARCHAR(20) NULL,
    `fichaClinica` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,

    UNIQUE INDEX `Madre_rut_key`(`rut`),
    UNIQUE INDEX `Madre_fichaClinica_key`(`fichaClinica`),
    INDEX `Madre_rut_idx`(`rut`),
    INDEX `Madre_fichaClinica_idx`(`fichaClinica`),
    INDEX `Madre_apellidos_nombres_idx`(`apellidos`, `nombres`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Parto` (
    `id` CHAR(36) NOT NULL,
    `madreId` CHAR(36) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `tipo` ENUM('EUTOCICO', 'DISTOCICO', 'CESAREA_ELECTIVA', 'CESAREA_EMERGENCIA') NOT NULL,
    `lugar` ENUM('SALA_PARTO', 'PABELLON', 'DOMICILIO', 'OTRO') NOT NULL,
    `lugarDetalle` VARCHAR(120) NULL,
    `matronaId` CHAR(36) NULL,
    `medicoId` CHAR(36) NULL,
    `complicaciones` VARCHAR(500) NULL,
    `observaciones` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,

    INDEX `Parto_madreId_idx`(`madreId`),
    INDEX `Parto_fechaHora_idx`(`fechaHora`),
    INDEX `Parto_tipo_idx`(`tipo`),
    INDEX `Parto_lugar_idx`(`lugar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecienNacido` (
    `id` CHAR(36) NOT NULL,
    `partoId` CHAR(36) NOT NULL,
    `sexo` ENUM('M', 'F', 'I') NOT NULL,
    `pesoGr` INTEGER NULL,
    `tallaCm` INTEGER NULL,
    `apgar1` INTEGER NULL,
    `apgar5` INTEGER NULL,
    `observaciones` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,

    INDEX `RecienNacido_partoId_idx`(`partoId`),
    INDEX `RecienNacido_sexo_idx`(`sexo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EpisodioURNI` (
    `id` CHAR(36) NOT NULL,
    `rnId` CHAR(36) NOT NULL,
    `estado` ENUM('INGRESADO', 'ALTA') NOT NULL DEFAULT 'INGRESADO',
    `fechaIngreso` DATETIME(3) NOT NULL,
    `motivoIngreso` VARCHAR(300) NULL,
    `fechaAlta` DATETIME(3) NULL,
    `condicionEgreso` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,

    INDEX `EpisodioURNI_rnId_idx`(`rnId`),
    INDEX `EpisodioURNI_estado_idx`(`estado`),
    INDEX `EpisodioURNI_fechaIngreso_idx`(`fechaIngreso`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtencionURNI` (
    `id` CHAR(36) NOT NULL,
    `rnId` CHAR(36) NOT NULL,
    `episodioId` CHAR(36) NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diagnostico` VARCHAR(500) NULL,
    `indicaciones` VARCHAR(800) NULL,
    `medicoId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AtencionURNI_rnId_idx`(`rnId`),
    INDEX `AtencionURNI_episodioId_idx`(`episodioId`),
    INDEX `AtencionURNI_fechaHora_idx`(`fechaHora`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ControlNeonatal` (
    `id` CHAR(36) NOT NULL,
    `rnId` CHAR(36) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` ENUM('SIGNOS_VITALES', 'GLUCEMIA', 'ALIMENTACION', 'MEDICACION', 'OTRO') NOT NULL DEFAULT 'SIGNOS_VITALES',
    `datos` JSON NULL,
    `observaciones` VARCHAR(500) NULL,
    `enfermeraId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ControlNeonatal_rnId_idx`(`rnId`),
    INDEX `ControlNeonatal_fechaHora_idx`(`fechaHora`),
    INDEX `ControlNeonatal_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReporteREM` (
    `id` CHAR(36) NOT NULL,
    `periodo` VARCHAR(7) NOT NULL,
    `jsonFuente` JSON NOT NULL,
    `totales` JSON NOT NULL,
    `generadoPorId` CHAR(36) NULL,
    `generadoAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReporteREM_periodo_idx`(`periodo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auditoria` (
    `id` CHAR(36) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` CHAR(36) NULL,
    `rol` VARCHAR(40) NULL,
    `entidad` VARCHAR(80) NOT NULL,
    `entidadId` VARCHAR(36) NULL,
    `accion` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'PERMISSION_DENIED') NOT NULL,
    `detalleBefore` JSON NULL,
    `detalleAfter` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,

    INDEX `Auditoria_fechaHora_idx`(`fechaHora`),
    INDEX `Auditoria_entidad_entidadId_idx`(`entidad`, `entidadId`),
    INDEX `Auditoria_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PulseraNFC` (
    `id` CHAR(36) NOT NULL,
    `uidTag` VARCHAR(64) NOT NULL,
    `estado` ENUM('ACTIVA', 'REEMPLAZADA', 'BAJA') NOT NULL DEFAULT 'ACTIVA',
    `rnId` CHAR(36) NOT NULL,
    `asignadaAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reemplazadaPorId` CHAR(36) NULL,

    UNIQUE INDEX `PulseraNFC_uidTag_key`(`uidTag`),
    UNIQUE INDEX `PulseraNFC_rnId_key`(`rnId`),
    INDEX `PulseraNFC_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Madre` ADD CONSTRAINT `Madre_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Madre` ADD CONSTRAINT `Madre_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parto` ADD CONSTRAINT `Parto_madreId_fkey` FOREIGN KEY (`madreId`) REFERENCES `Madre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parto` ADD CONSTRAINT `Parto_matronaId_fkey` FOREIGN KEY (`matronaId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parto` ADD CONSTRAINT `Parto_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parto` ADD CONSTRAINT `Parto_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Parto` ADD CONSTRAINT `Parto_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecienNacido` ADD CONSTRAINT `RecienNacido_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecienNacido` ADD CONSTRAINT `RecienNacido_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecienNacido` ADD CONSTRAINT `RecienNacido_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EpisodioURNI` ADD CONSTRAINT `EpisodioURNI_rnId_fkey` FOREIGN KEY (`rnId`) REFERENCES `RecienNacido`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EpisodioURNI` ADD CONSTRAINT `EpisodioURNI_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EpisodioURNI` ADD CONSTRAINT `EpisodioURNI_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtencionURNI` ADD CONSTRAINT `AtencionURNI_rnId_fkey` FOREIGN KEY (`rnId`) REFERENCES `RecienNacido`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtencionURNI` ADD CONSTRAINT `AtencionURNI_episodioId_fkey` FOREIGN KEY (`episodioId`) REFERENCES `EpisodioURNI`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtencionURNI` ADD CONSTRAINT `AtencionURNI_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ControlNeonatal` ADD CONSTRAINT `ControlNeonatal_rnId_fkey` FOREIGN KEY (`rnId`) REFERENCES `RecienNacido`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ControlNeonatal` ADD CONSTRAINT `ControlNeonatal_enfermeraId_fkey` FOREIGN KEY (`enfermeraId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReporteREM` ADD CONSTRAINT `ReporteREM_generadoPorId_fkey` FOREIGN KEY (`generadoPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Auditoria` ADD CONSTRAINT `Auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PulseraNFC` ADD CONSTRAINT `PulseraNFC_rnId_fkey` FOREIGN KEY (`rnId`) REFERENCES `RecienNacido`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
