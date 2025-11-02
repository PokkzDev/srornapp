/*
  Warnings:

  - Added the required column `updatedAt` to the `RolePermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserPermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `rolepermission` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `userpermission` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `userrole` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `RolePermission_roleId_idx` ON `RolePermission`(`roleId`);

-- CreateIndex
CREATE INDEX `UserPermission_userId_idx` ON `UserPermission`(`userId`);

-- CreateIndex
CREATE INDEX `UserRole_userId_idx` ON `UserRole`(`userId`);
