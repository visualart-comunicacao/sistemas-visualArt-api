// src/modules/whatsapp/whatsapp.service.js
import { prisma } from '../../db/prisma.js'

const GRAPH_BASE = 'https://graph.facebook.com'

function getGraphVersion() {
  return process.env.WHATSAPP_GRAPH_VERSION || 'v20.0'
}

function assertEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

// --------------------
// Contacts / Tickets
// --------------------
export async function upsertContactFromInbound({ waId, name, phoneE164 }) {
  return prisma.contact.upsert({
    where: { waId },
    update: {
      name: name ?? undefined,
      phoneE164: phoneE164 ?? undefined,
    },
    create: {
      waId,
      name: name ?? null,
      phoneE164: phoneE164 ?? null,
      channel: 'WHATSAPP',
    },
  })
}

export async function findOrCreateOpenTicket(contactId) {
  const existing = await prisma.ticket.findFirst({
    where: { contactId, status: 'OPEN', channel: 'WHATSAPP' },
    orderBy: { createdAt: 'desc' },
  })
  if (existing) return existing

  return prisma.ticket.create({
    data: {
      channel: 'WHATSAPP',
      status: 'OPEN',
      contactId,
      assignedToId: null,
      lastMessageAt: new Date(),
      waWindowUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
}

// --------------------
// Messages
// --------------------
export async function storeInboundMessage({
  ticketId,
  providerMessageId,
  type,
  text,
  mediaUrl,
  mimeType,
  createdAt,
}) {
  return prisma.message.create({
    data: {
      ticketId,
      direction: 'IN',
      type: normalizeMessageType(type),
      text: text ?? null,
      mediaUrl: mediaUrl ?? null,
      mimeType: mimeType ?? null,
      providerMessageId: providerMessageId ?? null,
      status: 'RECEIVED',
      createdAt: createdAt ?? new Date(),
    },
  })
}

export async function storeOutboundMessageSent({
  ticketId,
  providerMessageId,
  type,
  text,
  mediaUrl,
  mimeType,
  createdAt,
}) {
  return prisma.message.create({
    data: {
      ticketId,
      direction: 'OUT',
      type: normalizeMessageType(type),
      text: text ?? null,
      mediaUrl: mediaUrl ?? null,
      mimeType: mimeType ?? null,
      providerMessageId: providerMessageId ?? null,
      status: 'SENT',
      createdAt: createdAt ?? new Date(),
    },
  })
}

export async function storeOutboundMessageFailed({
  ticketId,
  type,
  text,
  mediaUrl,
  mimeType,
  createdAt,
}) {
  return prisma.message.create({
    data: {
      ticketId,
      direction: 'OUT',
      type: normalizeMessageType(type),
      text: text ?? null,
      mediaUrl: mediaUrl ?? null,
      mimeType: mimeType ?? null,
      providerMessageId: null,
      status: 'FAILED',
      createdAt: createdAt ?? new Date(),
    },
  })
}

export async function bumpTicketWindow(ticketId) {
  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      lastMessageAt: new Date(),
      waWindowUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
}

export async function updateMessageStatus(providerMessageId, nextStatus) {
  if (!providerMessageId) return null

  const status = mapProviderStatus(nextStatus)
  if (!status) return null

  return prisma.message.updateMany({
    where: { providerMessageId },
    data: { status },
  })
}

// --------------------
// Provider (Graph API)
// --------------------
export async function sendTextMessage({ toWaId, text }) {
  const accessToken = assertEnv('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = assertEnv('WHATSAPP_PHONE_NUMBER_ID')

  const url = `${GRAPH_BASE}/${getGraphVersion()}/${phoneNumberId}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toWaId,
      type: 'text',
      text: { body: text },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const upstreamStatus = res.status

    const msg = data?.error?.message || 'WhatsApp API error'
    const err = new Error(msg)

    // Se for erro de auth do provedor (Graph/WhatsApp),
    // NÃO repassar 401/403 como 401 pro seu ERP
    if (upstreamStatus === 401 || upstreamStatus === 403) {
      err.status = 502 // Bad Gateway (erro do provedor)
    } else {
      err.status = upstreamStatus
    }

    err.details = data?.error || data
    throw err
  }

  const messageId = data?.messages?.[0]?.id ?? null
  return { messageId, raw: data }
}

export async function getMediaUrl(mediaId) {
  if (!mediaId) return null
  const accessToken = assertEnv('WHATSAPP_ACCESS_TOKEN')
  const url = `${GRAPH_BASE}/${getGraphVersion()}/${mediaId}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return null

  return data?.url ?? null
}

export async function sendTemplateMessage({ toWaId, templateName, languageCode = 'en_US', components }) {
  const accessToken = assertEnv('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = assertEnv('WHATSAPP_PHONE_NUMBER_ID')

  const url = `${GRAPH_BASE}/${getGraphVersion()}/${phoneNumberId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    to: toWaId,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  }

  // componentes são opcionais (para templates com variáveis/botões)
  if (Array.isArray(components) && components.length > 0) {
    body.template.components = components
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || 'WhatsApp template send failed'
    const details = data?.error ? JSON.stringify(data.error) : ''
    const err = new Error(`${msg} ${details}`.trim())
    err.status = res.status
    err.details = data?.error || data
    throw err
  }

  const messageId = data?.messages?.[0]?.id ?? null
  return { messageId, raw: data }
}

// --------------------
// Helpers
// --------------------
function normalizeMessageType(t) {
  const x = (t || '').toUpperCase()
  if (['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'STICKER'].includes(x)) return x
  return 'UNKNOWN'
}

function mapProviderStatus(s) {
  const x = (s || '').toUpperCase()
  if (x === 'SENT') return 'SENT'
  if (x === 'DELIVERED') return 'DELIVERED'
  if (x === 'READ') return 'READ'
  if (x === 'FAILED') return 'FAILED'
  return null
}