import { prisma } from '../../db/prisma.js'

function plus24h(d) {
  return new Date(d.getTime() + 24 * 60 * 60 * 1000)
}

export async function ingestIncomingText({ fromWaId, providerMessageId, contactName, text, createdAt }) {
  // dedupe
  const exists = await prisma.message.findUnique({
    where: { providerMessageId },
    select: { id: true },
  })
  if (exists) return null

  // contact
  const contact = await prisma.contact.upsert({
    where: { waId: fromWaId },
    create: {
      waId: fromWaId,
      phoneE164: fromWaId,
      name: contactName || null,
    },
    update: {
      phoneE164: fromWaId,
      name: contactName || undefined,
    },
  })

  // ticket OPEN/PENDING do contato
  let ticket = await prisma.ticket.findFirst({
    where: { contactId: contact.id, status: { in: ['OPEN', 'PENDING'] } },
    orderBy: { createdAt: 'desc' },
  })

  const ts = createdAt ? new Date(createdAt) : new Date()

  if (!ticket) {
    ticket = await prisma.ticket.create({
      data: {
        contactId: contact.id,
        status: 'OPEN',
        lastMessageAt: ts,
        waWindowUntil: plus24h(ts),
      },
    })
  }

  // message IN
  const msg = await prisma.message.create({
    data: {
      ticketId: ticket.id,
      direction: 'IN',
      type: 'TEXT',
      text: text || null,
      providerMessageId,
      status: 'RECEIVED',
      createdAt: ts,
    },
  })

  // update ticket
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { lastMessageAt: ts, waWindowUntil: plus24h(ts), status: 'OPEN' },
  })

  return msg
}