-- CreateTable
CREATE TABLE IF NOT EXISTS "PriceLog" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "productName" TEXT,
    "oldPrice" DOUBLE PRECISION,
    "newPrice" DOUBLE PRECISION,
    "oldMarkup" DOUBLE PRECISION,
    "newMarkup" DOUBLE PRECISION,
    "changeType" TEXT NOT NULL,
    "details" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PriceLog_productId_idx" ON "PriceLog"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PriceLog_createdAt_idx" ON "PriceLog"("createdAt");
