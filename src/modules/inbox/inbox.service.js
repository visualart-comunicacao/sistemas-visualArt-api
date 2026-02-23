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

  // regra: atendente comum só pode assumir pra si, e só se:
  // - está em espera OU já é dele
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

  // atendente comum precisa ser o responsável
  if (!isAdmin && ticket.assignedToId !== actor.id) {
    const e = new Error('Forbidden: you are not assigned to this ticket')
    e.statusCode = 403
    throw e
  }

  // regra 24h: por enquanto, bloqueia fora da janela (depois implementamos template)
  if (!isWithinWindow(ticket.waWindowUntil)) {
    const e = new Error('WhatsApp 24h window expired: template required')
    e.statusCode = 409
    throw e
  }

  // enviar via Meta
  const toWaId = ticket.contact.waId
  const { messageId } = await sendTextMessage({ toWaId, text: text.trim() })

  // salvar OUT
  const msg = await repo.createOutboundMessage({
    ticketId,
    text: text.trim(),
    providerMessageId: messageId,
    status: 'SENT',
  })
  await repo.bumpTicketLastMessage(ticketId)

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
  mediaUrl,
  mimeType,
  sizeBytes,
  durationMs,
}) {
  // opcional: valida ticket existe / permissão
  const message = await prisma.message.create({
    data: {
      ticketId,
      type: 'AUDIO',
      direction: 'OUT',
      mediaUrl,
      mimeType,
      sizeBytes,
      durationMs,
      // se você tem authorId/senderId:
      // userId,
    },
  })

  // SSE: mesmo padrão que você já usa pro realtime
  bus.emit('message.created', {
    ticketId,
    message,
  })

  return message
}

