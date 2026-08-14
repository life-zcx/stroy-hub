-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isDeleted_idx" ON "Product"("isDeleted");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiChatLog_userId_idx" ON "AiChatLog"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiChatLog_ip_idx" ON "AiChatLog"("ip");
