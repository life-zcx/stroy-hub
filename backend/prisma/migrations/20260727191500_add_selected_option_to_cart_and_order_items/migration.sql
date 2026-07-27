-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "selectedOption" TEXT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "selectedOption" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "CartItem_userId_productId_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_userId_productId_selectedOption_key" ON "CartItem"("userId", "productId", "selectedOption");
