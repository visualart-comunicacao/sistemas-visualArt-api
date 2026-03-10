/*
  Warnings:

  - The values [IN,OUT] on the enum `PunchType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `at` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the `Adjustment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Policy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workday` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `timestamp` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PunchType_new" AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END');
ALTER TABLE "TimeEntry" ALTER COLUMN "type" TYPE "PunchType_new" USING ("type"::text::"PunchType_new");
ALTER TYPE "PunchType" RENAME TO "PunchType_old";
ALTER TYPE "PunchType_new" RENAME TO "PunchType";
DROP TYPE "PunchType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Adjustment" DROP CONSTRAINT "Adjustment_workdayId_fkey";

-- DropForeignKey
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Workday" DROP CONSTRAINT "Workday_employeeId_fkey";

-- DropIndex
DROP INDEX "TimeEntry_employeeId_at_idx";

-- AlterTable
ALTER TABLE "TimeEntry" DROP COLUMN "at",
DROP COLUMN "employeeId",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Adjustment";

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "Policy";

-- DropTable
DROP TABLE "Workday";

-- DropEnum
DROP TYPE "WorkdayStatus";

-- CreateTable
CREATE TABLE "WorkDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "firstInAt" TIMESTAMP(3),
    "lastOutAt" TIMESTAMP(3),
    "workedMs" INTEGER NOT NULL DEFAULT 0,
    "breakMs" INTEGER NOT NULL DEFAULT 0,
    "extraMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkDay_date_idx" ON "WorkDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkDay_userId_date_key" ON "WorkDay"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_timestamp_idx" ON "TimeEntry"("userId", "timestamp");
