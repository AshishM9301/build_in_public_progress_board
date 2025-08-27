/*
  Warnings:

  - You are about to drop the column `imageData` on the `DailyProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."DailyProgress" DROP COLUMN "imageData",
ADD COLUMN     "imageUrl" TEXT;
