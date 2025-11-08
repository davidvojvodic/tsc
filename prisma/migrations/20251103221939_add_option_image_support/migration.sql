-- Migration: Add image support to Option table
-- Date: 2025-11-03
-- Purpose: Enable flexible content types (text/image/mixed) for quiz options
-- Safety: All fields are NULL by default except contentType which gets backfilled

-- Add image support fields to option table
-- These fields enable text-only, image-only, or mixed content types
ALTER TABLE `option`
  ADD COLUMN `imageUrl` VARCHAR(2048) NULL COMMENT 'URL of the option image (for image/mixed content types)',
  ADD COLUMN `altText` TEXT NULL COMMENT 'Alt text for image in English',
  ADD COLUMN `altText_sl` TEXT NULL COMMENT 'Alt text for image in Slovenian',
  ADD COLUMN `altText_hr` TEXT NULL COMMENT 'Alt text for image in Croatian',
  ADD COLUMN `contentType` VARCHAR(20) NULL DEFAULT 'text' COMMENT 'Content type: text, image, or mixed',
  ADD COLUMN `imageSuffix` TEXT NULL COMMENT 'Suffix text after image in mixed content (English)',
  ADD COLUMN `imageSuffix_sl` TEXT NULL COMMENT 'Suffix text after image in mixed content (Slovenian)',
  ADD COLUMN `imageSuffix_hr` TEXT NULL COMMENT 'Suffix text after image in mixed content (Croatian)';

-- Backfill existing records to have contentType 'text'
UPDATE `option` SET `contentType` = 'text' WHERE `contentType` IS NULL;

-- Make contentType non-nullable now that all records have a value
ALTER TABLE `option` MODIFY COLUMN `contentType` VARCHAR(20) NOT NULL DEFAULT 'text' COMMENT 'Content type: text, image, or mixed';

-- Create index on contentType for efficient filtering
CREATE INDEX `option_contentType_idx` ON `option`(`contentType`);

-- Safety Notes:
-- 1. All fields are nullable - existing options default to NULL
-- 2. contentType defaults to 'text' for new records
-- 3. Existing quizzes will continue to work unchanged
-- 4. No data transformation required
-- 5. Backward compatible: legacy text-only options work without modification
-- 6. Rollback safe: Can drop columns if needed (data loss only for new image options)
