-- AlterTable: add B2B / legal entity fields to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "entityType"       TEXT NOT NULL DEFAULT 'PHYSICAL',
  ADD COLUMN IF NOT EXISTS "companyBin"       TEXT,
  ADD COLUMN IF NOT EXISTS "companyName"      TEXT,
  ADD COLUMN IF NOT EXISTS "directorName"     TEXT,
  ADD COLUMN IF NOT EXISTS "legalAddress"     TEXT,
  ADD COLUMN IF NOT EXISTS "organizationType" TEXT,
  ADD COLUMN IF NOT EXISTS "isBlocked"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "blockedAt"        TIMESTAMP(3);
