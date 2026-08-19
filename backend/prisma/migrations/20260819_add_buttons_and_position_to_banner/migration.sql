-- AlterTable
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "buttons" JSONB;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "position" TEXT DEFAULT 'bottom-left';
