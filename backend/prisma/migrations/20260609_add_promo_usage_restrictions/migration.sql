-- AddColumn: maxUsagePerUser and isFirstOrderOnly to Promotion
ALTER TABLE "Promotion" ADD COLUMN "maxUsagePerUser" INTEGER;
ALTER TABLE "Promotion" ADD COLUMN "isFirstOrderOnly" BOOLEAN NOT NULL DEFAULT false;
