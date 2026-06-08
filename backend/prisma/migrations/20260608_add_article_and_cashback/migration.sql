-- Add article field to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "article" TEXT;

-- Add cashbackPercent field to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cashbackPercent" INTEGER;

-- Add cashbackPercent field to Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "cashbackPercent" INTEGER;
