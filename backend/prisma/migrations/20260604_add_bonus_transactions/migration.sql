-- CreateTable
CREATE TABLE "BonusTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BonusTransaction_userId_idx" ON "BonusTransaction"("userId");

-- CreateIndex
CREATE INDEX "BonusTransaction_orderId_idx" ON "BonusTransaction"("orderId");

-- CreateIndex
CREATE INDEX "BonusTransaction_status_idx" ON "BonusTransaction"("status");

-- CreateIndex
CREATE INDEX "BonusTransaction_type_idx" ON "BonusTransaction"("type");

-- CreateIndex
CREATE INDEX "BonusTransaction_userId_status_idx" ON "BonusTransaction"("userId", "status");

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
