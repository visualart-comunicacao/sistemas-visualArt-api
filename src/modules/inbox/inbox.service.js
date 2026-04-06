import * as repo from './inbox.repository.js'
import { sendTextMessage } from '../whatsapp/whatsapp.service.js'
import { bus } from '../../realtime/bus.js'
import { prisma } from '../../db/prisma.js'

function isWithinWindow(waWindowUntil) {
  if (!waWindowUntil) return false
  return new Date(waWindowUntil).getTime() > Date.now()
}

export async function listTickets(ctx) {
  return repo.listTickets(ctx)
}

export async function getTicket(ticketId) {
  const t = await repo.getTicketById(ticketId)
  if (!t) {
    const e = new Error('Ticket not found')
    e.statusCode = 404
    throw e
  }
  return t
}

export async function getMessages(ticketId) {
  await getTicket(ticketId)
  return repo.listMessages(ticketId)
}

export async function assignTicket({ ticketId, actor, toUserId }) {
  const ticket = await getTicket(ticketId)

  const isAdmin = actor.role === 'ADMIN'
  const targetId = toUserId ?? actor.id

  if (!isAdmin) {
    if (toUserId && toUserId !== actor.id) {
      const e = new Error('Forbidden: cannot transfer ticket')
      e.statusCode = 403
      throw e
    }
    if (ticket.assignedToId && ticket.assignedToId !== actor.id) {
      const e = new Error('Forbidden: ticket owned by another user')
      e.statusCode = 403
      throw e
    }
  }

  return repo.assignTicket({ ticketId, assignedToId: targetId })
}

export async function closeTicket({ ticketId, actor }) {
  const ticket = await getTicket(ticketId)
  const isAdmin = actor.role === 'ADMIN'

  if (!isAdmin && ticket.assignedToId !== actor.id) {
    const e = new Error('Forbidden')
    e.statusCode = 403
    throw e
  }

  return repo.closeTicket(ticketId)
}

export async function sendMessage({ ticketId, actor, text }) {
  



  if (!text || !text.trim()) {
    const e = new Error('Text is required')
    e.statusCode = 400
    throw e
  }

  const ticket = await getTicket(ticketId)
  const isAdmin = actor.role === 'ADMIN'

  if (!isAdmin && ticket.assignedToId !== actor.id) {
    const e = new Error('Forbidden: you are not assigned to this ticket')
    e.statusCode = 403
    throw e
  }

  if (!isWithinWindow(ticket.waWindowUntil)) {
    const e = new Error('WhatsApp 24h window expired: template required')
    e.statusCode = 409
    throw e
  }

  const dbUser = actor?.id
  ? await prisma.user.findUnique({
      where: { id: actor.id },
      select: { id: true, name: true, role: true },
    })
  : null

  let senderUserId = dbUser?.id ?? null
  let senderName = dbUser?.name ?? 'Atendente'

  if (actor?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { id: true, name: true },
    })

    if (dbUser) {
      senderUserId = dbUser.id
      senderName = dbUser.name ?? senderName
    }
  }

  const toWaId = ticket.contact.waId
  const { messageId } = await sendTextMessage({
    toWaId,
    text: text.trim(),
  })

  const msg = await repo.createOutboundMessage({
    ticketId,
    text: text.trim(),
    providerMessageId: messageId,
    status: 'SENT',
    senderType: 'AGENT',
    senderUserId,
    senderName,
  })

  await repo.bumpTicketLastMessage(ticketId)

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      lastOutboundById: senderUserId,
      ...(ticket.assignedToId
        ? {}
        : senderUserId
          ? { assignedToId: senderUserId, claimedAt: new Date() }
          : {}),
    },
  })

  const updatedTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      contact: true,
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  })

  bus.emit('message.created', {
    source: 'inbox.send',
    ticket: updatedTicket,
    message: msg,
  })

  return msg
}

export async function createVoiceOutMessage({
  ticketId,
  userId,
  userName,
  mediaUrl,
  mimeType,
  sizeBytes,
  durationMs,
}) {
  let senderUserId = null
  let senderName = userName ?? 'Atendente'

  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (dbUser) {
      senderUserId = dbUser.id
      senderName = dbUser.name ?? senderName
    }
  }

  const message = await prisma.message.create({
    data: {
      ticketId,
      type: 'AUDIO',
      direction: 'OUT',
      mediaUrl,
      mimeType,
      sizeBytes,
      durationMs,
      senderType: 'AGENT',
      senderUserId,
      senderName,
      status: 'SENT',
    },
  })

  bus.emit('message.created', {
    ticketId,
    message,
  })

  return message
}

export async function listAgents() {
  return prisma.user.findMany({
    where: {
      isActive: true,
      isChatAgent: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}