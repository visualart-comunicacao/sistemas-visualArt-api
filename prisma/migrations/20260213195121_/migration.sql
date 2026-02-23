/*
  Warnings:

  - A unique constraint covering the columns `[sourceQuoteId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "sourceQuoteId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_sourceQuoteId_key" ON "Order"("sourceQuoteId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sourceQuoteId_fkey" FOREIGN KEY ("sourceQuoteId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
