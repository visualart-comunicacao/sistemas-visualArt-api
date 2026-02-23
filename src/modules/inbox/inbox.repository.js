import { prisma } from '../../db/prisma.js'

function buildWhere({ queue, userId, isAdmin }) {
  // status base: não fechados
  const where = {
    status: { in: ['OPEN', 'PENDING'] },
  }

  const q = String(queue ?? 'meus').toLowerCase()

  if (q === 'meus') {
    where.assignedToId = userId
  } else if (q === 'espera') {
    where.assignedToId = null
  } else if (q === 'todos') {
    // admin vê todos (OPEN/PENDING)
    // atendente comum: recomendo ver "meus + espera"
    if (!isAdmin) {
      where.OR = [{ assignedToId: userId }, { assignedToId: null }]
    }
  } else {
    where.assignedToId = userId
  }

  return where
}

export async function listTickets({ queue, userId, isAdmin, take = 30, skip = 0 }) {
  const where = buildWhere({ queue, userId, isAdmin })

  const [total, items] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy: [
        { lastMessageAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      take,
      skip,
      include: {
        contact: true,
        assignedTo: { select: { id: true, name: true, role: true } },
        // prévia: última mensagem
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ])

  return { total, items }
}

export async function getTicketById(ticketId) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      contact: true,
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  })
}

export async function listMessages(ticketId) {
  return prisma.message.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function assignTicket({ ticketId, assignedToId }) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId, // null => volta pra "Espera"
      status: 'OPEN', // opcional: ao assumir, deixa OPEN
      updatedAt: new Date(),
    },
    include: {
      contact: true,
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  })
}

export async function closeTicket(ticketId) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CLOSED',
      updatedAt: new Date(),
    },
  })
}

export async function createOutboundMessage({ ticketId, text, providerMessageId, status = 'SENT' }) {
  return prisma.message.create({
    data: {
      ticketId,
      direction: 'OUT',
      type: 'TEXT',
      text,
      providerMessageId,
      status,
    },
  })
}

export async function bumpTicketLastMessage(ticketId) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    },
  })
}