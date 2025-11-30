/*
  Warnings:

  - You are about to drop the column `complicaciones` on the `parto` table. All the data in the column will be lost.
  - The values [EUTOCICO,DISTOCICO,CESAREA_EMERGENCIA] on the enum `Parto_tipo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `apgar1` on the `reciennacido` table. All the data in the column will be lost.
  - You are about to drop the column `apgar5` on the `reciennacido` table. All the data in the column will be lost.
  - You are about to drop the column `pesoGr` on the `reciennacido` table. All the data in the column will be lost.
  - You are about to drop the `pulseranfc` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `pulseranfc` DROP FOREIGN KEY `PulseraNFC_rnId_fkey`;

-- AlterTable
ALTER TABLE `madre` ADD COLUMN `condicionDiscapacidad` BOOLEAN NULL,
    ADD COLUMN `condicionMigrante` BOOLEAN NULL,
    ADD COLUMN `condicionPrivadaLibertad` BOOLEAN NULL,
    ADD COLUMN `controlPrenatal` BOOLEAN NULL,
    ADD COLUMN `edadAnos` INTEGER NULL,
    ADD COLUMN `hepatitisBPositiva` BOOLEAN NULL,
    ADD COLUMN `identidadTrans` BOOLEAN NULL,
    ADD COLUMN `pertenenciaPuebloOriginario` BOOLEAN NULL;

-- AlterTable
ALTER TABLE `parto` DROP COLUMN `complicaciones`,
    ADD COLUMN `acompananteDuranteTrabajo` BOOLEAN NULL,
    ADD COLUMN `acompananteSoloExpulsivo` BOOLEAN NULL,
    ADD COLUMN `analgesiaEndovenosa` BOOLEAN NULL,
    ADD COLUMN `anestesiaGeneral` BOOLEAN NULL,
    ADD COLUMN `anestesiaLocal` BOOLEAN NULL,
    ADD COLUMN `anestesiaNeuroaxial` BOOLEAN NULL,
    ADD COLUMN `atencionPertinenciaCultural` BOOLEAN NULL,
    ADD COLUMN `complicacionesTexto` VARCHAR(500) NULL,
    ADD COLUMN `conduccionOxitocica` BOOLEAN NULL,
    ADD COLUMN `contactoPielPielAcomp30min` BOOLEAN NULL,
    ADD COLUMN `contactoPielPielMadre30min` BOOLEAN NULL,
    ADD COLUMN `edadGestacionalSemanas` INTEGER NULL,
    ADD COLUMN `embarazoNoControlado` BOOLEAN NULL,
    ADD COLUMN `entregaPlacentaSolicitud` BOOLEAN NULL,
    ADD COLUMN `episiotomia` BOOLEAN NULL,
    ADD COLUMN `establecimientoId` VARCHAR(191) NULL,
    ADD COLUMN `fechaParto` DATETIME(3) NULL,
    ADD COLUMN `inicioTrabajoParto` ENUM('ESPONTANEO', 'INDUCIDO_MECANICO', 'INDUCIDO_FARMACOLOGICO') NULL,
    ADD COLUMN `lactancia60minAlMenosUnRn` BOOLEAN NULL,
    ADD COLUMN `libertadMovimiento` BOOLEAN NULL,
    ADD COLUMN `ligaduraTardiaCordon` BOOLEAN NULL,
    ADD COLUMN `manejoDolorFarmacologico` BOOLEAN NULL,
    ADD COLUMN `manejoDolorNoFarmacologico` BOOLEAN NULL,
    ADD COLUMN `medidasNoFarmacologicasAnestesia` BOOLEAN NULL,
    ADD COLUMN `oxidoNitroso` BOOLEAN NULL,
    ADD COLUMN `oxitocinaProfilactica` BOOLEAN NULL,
    ADD COLUMN `planDeParto` BOOLEAN NULL,
    ADD COLUMN `posicionExpulsivo` ENUM('LITOTOMIA', 'OTRAS') NULL,
    ADD COLUMN `regimenHidricoAmplio` BOOLEAN NULL,
    ADD COLUMN `tipoCursoParto` ENUM('EUTOCICO', 'DISTOCICO') NULL,
    MODIFY `tipo` ENUM('VAGINAL', 'INSTRUMENTAL', 'CESAREA_ELECTIVA', 'CESAREA_URGENCIA', 'PREHOSPITALARIO', 'FUERA_RED', 'DOMICILIO_PROFESIONAL', 'DOMICILIO_SIN_PROFESIONAL') NOT NULL;

-- AlterTable
ALTER TABLE `reciennacido` DROP COLUMN `apgar1`,
    DROP COLUMN `apgar5`,
    DROP COLUMN `pesoGr`,
    ADD COLUMN `alojamientoConjuntoInmediato` BOOLEAN NULL,
    ADD COLUMN `anomaliaCongenita` BOOLEAN NULL,
    ADD COLUMN `anomaliaCongenitaDescripcion` VARCHAR(500) NULL,
    ADD COLUMN `apgar1Min` INTEGER NULL,
    ADD COLUMN `apgar5Min` INTEGER NULL,
    ADD COLUMN `categoriaPeso` ENUM('MENOR_500', 'RANGO_500_999', 'RANGO_1000_1499', 'RANGO_1500_1999', 'RANGO_2000_2499', 'RANGO_2500_2999', 'RANGO_3000_3999', 'RANGO_4000_MAS') NULL,
    ADD COLUMN `contactoPielPielInmediato` BOOLEAN NULL,
    ADD COLUMN `ehiGradoII_III` BOOLEAN NULL,
    ADD COLUMN `esMigrante` BOOLEAN NULL,
    ADD COLUMN `esNacidoVivo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `esPuebloOriginario` BOOLEAN NULL,
    ADD COLUMN `hijoMadreHepatitisBPositiva` BOOLEAN NULL,
    ADD COLUMN `lactancia60Min` BOOLEAN NULL,
    ADD COLUMN `pesoNacimientoGramos` INTEGER NULL,
    ADD COLUMN `profilaxisCompletaHepatitisB` BOOLEAN NULL,
    ADD COLUMN `profilaxisHepatitisB` BOOLEAN NULL,
    ADD COLUMN `profilaxisOcularGonorrea` BOOLEAN NULL,
    ADD COLUMN `reanimacionAvanzada` BOOLEAN NULL,
    ADD COLUMN `reanimacionBasica` BOOLEAN NULL;

-- DropTable
DROP TABLE `pulseranfc`;

-- CreateTable
CREATE TABLE `ComplicacionObstetrica` (
    `id` CHAR(36) NOT NULL,
    `partoId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('HPP_INERCIA', 'HPP_RESTOS', 'HPP_TRAUMA', 'DESGARROS_III_IV', 'ALTERACION_COAGULACION', 'PREECLAMPSIA_SEVERA', 'ECLAMPSIA', 'SEPSIS_SISTEMICA_GRAVE', 'MANEJO_QUIRURGICO_INERCIA', 'HISTERCTOMIA_OBSTETRICA', 'ANEMIA_SEVERA_TRANSFUSION') NOT NULL,
    `contexto` ENUM('PARTO_ESPONTANEO_INSTITUCIONAL', 'PARTO_INDUCIDO_INSTITUCIONAL', 'CESAREA_URGENCIA', 'CESAREA_ELECTIVA', 'PARTO_DOMICILIO', 'EUTOCICO_ESPONTANEO', 'EUTOCICO_INDUCIDO', 'DISTOCICO_ESPONTANEO', 'DISTOCICO_INDUCIDO') NULL,
    `requiereTransfusion` BOOLEAN NULL,
    `fechaComplicacion` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ComplicacionObstetrica_partoId_idx`(`partoId`),
    INDEX `ComplicacionObstetrica_tipo_idx`(`tipo`),
    INDEX `ComplicacionObstetrica_fechaComplicacion_idx`(`fechaComplicacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EsterilizacionQuirurgica` (
    `id` CHAR(36) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `sexo` ENUM('M', 'F', 'INTERSEX', 'NO_REGISTRA') NOT NULL,
    `edadAnos` INTEGER NOT NULL,
    `tipo` ENUM('LIGADURA_TUBARIA', 'VASECTOMIA', 'OTRO') NULL,
    `condicionTrans` BOOLEAN NULL,
    `esPuebloOriginario` BOOLEAN NULL,
    `esMigrante` BOOLEAN NULL,
    `vinculoConParto` BOOLEAN NULL,
    `partoId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EsterilizacionQuirurgica_partoId_idx`(`partoId`),
    INDEX `EsterilizacionQuirurgica_fecha_idx`(`fecha`),
    INDEX `EsterilizacionQuirurgica_sexo_idx`(`sexo`),
    INDEX `EsterilizacionQuirurgica_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ComplicacionObstetrica` ADD CONSTRAINT `ComplicacionObstetrica_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EsterilizacionQuirurgica` ADD CONSTRAINT `EsterilizacionQuirurgica_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
