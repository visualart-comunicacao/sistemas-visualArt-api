-- CreateEnum
CREATE TYPE "WorkdayStatus" AS ENUM ('OPEN', 'CLOSED', 'INCOMPLETE', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('MANUAL_EDIT', 'FORGOT_PUNCH', 'MEDICAL', 'HOLIDAY', 'BUSINESS_TRIP', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');

-- AlterTable
ALTER TABLE "WorkDay" ADD COLUMN     "lateMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "missingMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "policyId" TEXT,
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "status" "WorkdayStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT,
    "role" "EmployeeRole" NOT NULL DEFAULT 'EMPLOYEE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "department" TEXT,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "entryTime" TEXT NOT NULL,
    "exitTime" TEXT NOT NULL,
    "lunchMinutes" INTEGER NOT NULL,
    "extraBreakMinutes" INTEGER NOT NULL,
    "dailyTargetMinutes" INTEGER NOT NULL,
    "toleranceMinutes" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkShift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "policyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeAdjustment" (
    "id" TEXT NOT NULL,
    "workDayId" TEXT NOT NULL,
    "type" "AdjustmentType" NOT NULL,
    "reason" TEXT,
    "deltaMs" INTEGER NOT NULL,
    "meta" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeApproval" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workDayId" TEXT,

    CONSTRAINT "TimeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_code_key" ON "EmployeeProfile"("code");

-- CreateIndex
CREATE INDEX "TimeAdjustment_workDayId_idx" ON "TimeAdjustment"("workDayId");

-- CreateIndex
CREATE INDEX "TimeAdjustment_createdById_idx" ON "TimeAdjustment"("createdById");

-- CreateIndex
CREATE INDEX "TimeApproval_userId_periodStart_periodEnd_idx" ON "TimeApproval"("userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "TimeApproval_status_idx" ON "TimeApproval"("status");

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkDay" ADD CONSTRAINT "WorkDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustment" ADD CONSTRAINT "TimeAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustment" ADD CONSTRAINT "TimeAdjustment_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "WorkDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeApproval" ADD CONSTRAINT "TimeApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeApproval" ADD CONSTRAINT "TimeApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeApproval" ADD CONSTRAINT "TimeApproval_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "WorkDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
