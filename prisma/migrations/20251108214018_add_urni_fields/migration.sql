/*
  Warnings:

  - You are about to drop the column `fechaAlta` on the `episodiourni` table. All the data in the column will be lost.
  - You are about to drop the column `fechaIngreso` on the `episodiourni` table. All the data in the column will be lost.
  - Added the required column `fechaHoraIngreso` to the `EpisodioURNI` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `EpisodioURNI_fechaIngreso_idx` ON `episodiourni`;

-- AlterTable
ALTER TABLE `atencionurni` ADD COLUMN `evolucion` VARCHAR(1000) NULL;

-- AlterTable
ALTER TABLE `controlneonatal` ADD COLUMN `episodioUrniId` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `episodiourni` DROP COLUMN `fechaAlta`,
    DROP COLUMN `fechaIngreso`,
    ADD COLUMN `fechaHoraAlta` DATETIME(3) NULL,
    ADD COLUMN `fechaHoraIngreso` DATETIME(3) NOT NULL,
    ADD COLUMN `responsableClinicoId` CHAR(36) NULL,
    ADD COLUMN `servicioUnidad` ENUM('URNI', 'UCIN', 'NEONATOLOGIA') NULL;

-- CreateIndex
CREATE INDEX `ControlNeonatal_episodioUrniId_idx` ON `ControlNeonatal`(`episodioUrniId`);

-- CreateIndex
CREATE INDEX `EpisodioURNI_fechaHoraIngreso_idx` ON `EpisodioURNI`(`fechaHoraIngreso`);

-- CreateIndex
CREATE INDEX `EpisodioURNI_responsableClinicoId_idx` ON `EpisodioURNI`(`responsableClinicoId`);

-- AddForeignKey
ALTER TABLE `EpisodioURNI` ADD CONSTRAINT `EpisodioURNI_responsableClinicoId_fkey` FOREIGN KEY (`responsableClinicoId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ControlNeonatal` ADD CONSTRAINT `ControlNeonatal_episodioUrniId_fkey` FOREIGN KEY (`episodioUrniId`) REFERENCES `EpisodioURNI`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
