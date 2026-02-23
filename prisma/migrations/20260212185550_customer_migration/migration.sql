-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'BUSINESS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('NOT_INFORMED', 'MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recipient" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "type" "AddressType" NOT NULL DEFAULT 'SHIPPING';

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'PERSON',
    "fullName" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender" NOT NULL DEFAULT 'NOT_INFORMED',
    "companyName" TEXT,
    "tradeName" TEXT,
    "stateTaxId" TEXT,
    "municipalTaxId" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "rg" TEXT,
    "phone2" TEXT,
    "whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_cpf_key" ON "CustomerProfile"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_cnpj_key" ON "CustomerProfile"("cnpj");

-- CreateIndex
CREATE INDEX "CustomerProfile_type_idx" ON "CustomerProfile"("type");

-- CreateIndex
CREATE INDEX "CustomerProfile_isBlocked_idx" ON "CustomerProfile"("isBlocked");

-- CreateIndex
CREATE INDEX "Address_type_idx" ON "Address"("type");

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
