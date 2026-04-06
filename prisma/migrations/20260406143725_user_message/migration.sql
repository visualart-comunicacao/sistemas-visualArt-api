-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('CUSTOMER', 'AGENT', 'SYSTEM');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "senderName" TEXT,
ADD COLUMN     "senderType" "MessageSenderType",
ADD COLUMN     "senderUserId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "lastOutboundById" TEXT;

-- CreateIndex
CREATE INDEX "Message_senderUserId_idx" ON "Message"("senderUserId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_lastOutboundById_fkey" FOREIGN KEY ("lastOutboundById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
