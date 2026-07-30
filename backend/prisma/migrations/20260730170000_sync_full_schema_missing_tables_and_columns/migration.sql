-- Comprehensive migration to synchronize all missing tables and fields from schema.prisma

-- Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPPLIER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PromotionType" AS ENUM ('CAMPAIGN', 'PROMOCODE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PromotionDiscountType" AS ENUM ('PERCENT', 'FIXED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PromotionScope" AS ENUM ('ORDER', 'PRODUCT', 'CATEGORY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: Brand
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CallbackRequest
CREATE TABLE IF NOT EXISTS "CallbackRequest" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PartnerRequest
CREATE TABLE IF NOT EXISTS "PartnerRequest" (
    "id" SERIAL NOT NULL,
    "contactName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Promotion
CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badge" TEXT,
    "promoCode" TEXT,
    "type" "PromotionType" NOT NULL DEFAULT 'CAMPAIGN',
    "scope" "PromotionScope" NOT NULL DEFAULT 'ORDER',
    "discountType" "PromotionDiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minOrderAmount" DOUBLE PRECISION,
    "minQuantity" INTEGER,
    "targetProductIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "targetCategoryIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "quantityTiers" JSONB,
    "theme" TEXT NOT NULL DEFAULT 'emerald',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnSite" BOOLEAN NOT NULL DEFAULT true,
    "showOnHome" BOOLEAN NOT NULL DEFAULT false,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsagePerUser" INTEGER,
    "isFirstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "image" TEXT,
    "imageCard" TEXT,
    "imageDetail" TEXT,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PageView
CREATE TABLE IF NOT EXISTS "PageView" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "sessionId" TEXT,
    "region" TEXT,
    "country" TEXT,
    "city" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AnalyticsEvent
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "sessionId" TEXT,
    "userId" INTEGER,
    "productId" INTEGER,
    "orderId" INTEGER,
    "searchQuery" TEXT,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "userAgent" TEXT,
    "ip" TEXT,
    "region" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PasswordResetToken
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Review
CREATE TABLE IF NOT EXISTS "Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AlterTable Product: add missing columns slug and images
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable Order: add missing columns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "companyBin" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promotionTitle" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promotionId" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promotionSnapshot" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "statusHistory" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "managerNotes" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "clientComment" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "usedBonusPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryDate" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryTime" TEXT;

-- Create Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Promotion_promoCode_key" ON "Promotion"("promoCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_userId_productId_key" ON "Review"("userId", "productId");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX IF NOT EXISTS "PageView_path_idx" ON "PageView"("path");
CREATE INDEX IF NOT EXISTS "PageView_sessionId_idx" ON "PageView"("sessionId");
CREATE INDEX IF NOT EXISTS "PageView_userId_idx" ON "PageView"("userId");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("type");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_productId_idx" ON "AnalyticsEvent"("productId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_orderId_idx" ON "AnalyticsEvent"("orderId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_searchQuery_idx" ON "AnalyticsEvent"("searchQuery");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Promotion_userId_fkey') THEN
        ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PageView_userId_fkey') THEN
        ALTER TABLE "PageView" ADD CONSTRAINT "PageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalyticsEvent_userId_fkey') THEN
        ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalyticsEvent_productId_fkey') THEN
        ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnalyticsEvent_orderId_fkey') THEN
        ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_productId_fkey') THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_userId_fkey') THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_promotionId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
