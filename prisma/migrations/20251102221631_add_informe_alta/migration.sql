-- CreateTable
CREATE TABLE `InformeAlta` (
    `id` CHAR(36) NOT NULL,
    `partoId` CHAR(36) NOT NULL,
    `episodioId` CHAR(36) NOT NULL,
    `fechaGeneracion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `formato` VARCHAR(10) NOT NULL,
    `generadoPorId` CHAR(36) NULL,
    `contenido` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InformeAlta_episodioId_key`(`episodioId`),
    INDEX `InformeAlta_partoId_idx`(`partoId`),
    INDEX `InformeAlta_episodioId_idx`(`episodioId`),
    INDEX `InformeAlta_fechaGeneracion_idx`(`fechaGeneracion`),
    INDEX `InformeAlta_generadoPorId_idx`(`generadoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InformeAlta` ADD CONSTRAINT `InformeAlta_partoId_fkey` FOREIGN KEY (`partoId`) REFERENCES `Parto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InformeAlta` ADD CONSTRAINT `InformeAlta_episodioId_fkey` FOREIGN KEY (`episodioId`) REFERENCES `EpisodioMadre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InformeAlta` ADD CONSTRAINT `InformeAlta_generadoPorId_fkey` FOREIGN KEY (`generadoPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
