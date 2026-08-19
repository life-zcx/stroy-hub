-- CreateTable
CREATE TABLE IF NOT EXISTS "Banner" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "buttonText" TEXT,
    "linkUrl" TEXT,
    "buttons" JSONB,
    "position" TEXT DEFAULT 'bottom-left',
    "imageDesktop" TEXT NOT NULL,
    "imageMobile" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

