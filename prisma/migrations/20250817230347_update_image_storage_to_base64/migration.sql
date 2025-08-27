/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `DailyProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."DailyProgress" DROP COLUMN "imageUrl",
ADD COLUMN     "imageData" TEXT;
