-- KVKK privacy notice: when a user acknowledged it at sign-up, and which version of the text they saw.
-- Additive only (two nullable columns; existing users stay empty). Apply BEFORE deploying the code that
-- reads them: Prisma selects every column of "User", so sign-in fails if the columns are missing.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyNoticeAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyNoticeVersion" TEXT;
