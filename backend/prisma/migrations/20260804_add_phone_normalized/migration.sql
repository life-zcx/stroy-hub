-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNormalized" TEXT;

-- Backfill phoneNormalized for existing users using regex replace
UPDATE "User" 
SET "phoneNormalized" = CASE 
  WHEN "phone" IS NOT NULL AND LENGTH(REGEXP_REPLACE("phone", '[^\d]', '', 'g')) = 11 AND REGEXP_REPLACE("phone", '[^\d]', '', 'g') LIKE '8%' 
    THEN '7' || SUBSTRING(REGEXP_REPLACE("phone", '[^\d]', '', 'g') FROM 2)
  WHEN "phone" IS NOT NULL AND LENGTH(REGEXP_REPLACE("phone", '[^\d]', '', 'g')) = 10 
    THEN '7' || REGEXP_REPLACE("phone", '[^\d]', '', 'g')
  WHEN "phone" IS NOT NULL 
    THEN REGEXP_REPLACE("phone", '[^\d]', '', 'g')
  ELSE NULL
END
WHERE "phoneNormalized" IS NULL AND "phone" IS NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_phoneNormalized_idx" ON "User"("phoneNormalized");
