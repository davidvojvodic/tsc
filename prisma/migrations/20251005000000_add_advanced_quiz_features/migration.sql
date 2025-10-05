-- AlterTable - Add new fields to question table
-- Note: imageUrl may already exist from a previous deployment, so we add it conditionally
ALTER TABLE `question`
  ADD COLUMN `questionType` ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT_INPUT', 'DROPDOWN', 'ORDERING', 'MATCHING', 'DRAG_DROP_IMAGE') NOT NULL DEFAULT 'SINGLE_CHOICE',
  ADD COLUMN `answersData` JSON NULL,
  ADD COLUMN `migrationVersion` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex for questionType
CREATE INDEX `question_questionType_idx` ON `question`(`questionType`);

-- CreateIndex for migrationVersion
CREATE INDEX `question_migrationVersion_idx` ON `question`(`migrationVersion`);

-- CreateIndex for composite index
CREATE INDEX `question_quizId_questionType_idx` ON `question`(`quizId`, `questionType`);

-- CreateTable for MigrationAudit
CREATE TABLE `migration_audit` (
    `id` VARCHAR(191) NOT NULL,
    `tableName` VARCHAR(100) NOT NULL,
    `operation` VARCHAR(50) NOT NULL,
    `oldData` JSON NULL,
    `newData` JSON NULL,
    `migrationPhase` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,

    INDEX `migration_audit_tableName_migrationPhase_idx`(`tableName`, `migrationPhase`),
    INDEX `migration_audit_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
