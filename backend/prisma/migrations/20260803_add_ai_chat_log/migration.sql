-- CreateTable
CREATE TABLE "AiChatLog" (
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "recommendedProdIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "ip" VARCHAR(45),
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiChatLog_createdAt_idx" ON "AiChatLog"("createdAt");
