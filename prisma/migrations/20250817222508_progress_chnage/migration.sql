-- AlterTable
ALTER TABLE "public"."DailyProgress" ADD COLUMN     "imageFilename" TEXT,
ADD COLUMN     "imageHeight" INTEGER,
ADD COLUMN     "imageMimeType" TEXT,
ADD COLUMN     "imageSize" INTEGER,
ADD COLUMN     "imageUploadedAt" TIMESTAMP(3),
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageWidth" INTEGER;
