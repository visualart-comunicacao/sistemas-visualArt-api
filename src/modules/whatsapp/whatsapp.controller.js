// src/modules/whatsapp/whatsapp.controller.js
import { parseWebhookEvents } from './whatsapp.mapper.js'
import { validateSendText } from './whatsapp.validator.js'
import {
  upsertContactFromInbound,
  findOrCreateOpenTicket,
  storeOutboundMessageSent,
  storeInboundMessage,
  bumpTicketWindow,
  sendTextMessage,
  getMediaUrl,
  downloadMediaBuffer,
  saveInboundAudioFile,
  markTicketLastOutboundBy,
  sendTemplateMessage,
} from './whatsapp.service.js'
import { ingestIncomingText } from './whatsapp.inbox.service.js'
import { bus } from '../../realtime/bus.js'
import { prisma } from '../../db/prisma.js'

export async function postSendTextByPhone(req, res, next) {
  try {
    const { toWaId, text, name } = req.body

    const contact = await upsertContactFromInbound({
      waId: toWaId,
      name: name ?? null,
      phoneE164: toWaId,
    })

    const ticket = await findOrCreateOpenTicket(contact.id)

    const { messageId, raw } = await sendTextMessage({ toWaId, text })

    const currentUser = req.user || req.authUser || null

    const msg = await storeOutboundMessageSent({
      ticketId: ticket.id,
      providerMessageId: messageId,
      type: 'TEXT',
      text,
      mediaUrl: null,
      mimeType: null,
      createdAt: new Date(),
      senderType: 'AGENT',
      senderUserId: currentUser?.id ?? null,
      senderName: currentUser?.name ?? null,
    })

    if (currentUser?.id) {
      await markTicketLastOutboundBy(ticket.id, currentUser)
    }

    await bumpTicketWindow(ticket.id)

    return res.json({
      ok: true,
      contactId: contact.id,
      ticketId: ticket.id,
      messageId,
      message: msg,
      raw,
    })
  } catch (err) {
    return next(err)
  }
}

export async function postWebhook(req, res, next) {
  res.sendStatus(200)

  try {
    const payload = req.body

    if (!payload || typeof payload !== 'object') {
      console.warn('[WA WEBHOOK] req.body inválido (não parseado). content-type:', req.headers['content-type'])
      console.warn('[WA WEBHOOK] body:', payload)
      return
    }

    const events = parseWebhookEvents(payload)

    for (const ev of events) {
      if (ev.direction !== 'IN') continue

      // TEXTO
      if (ev.type === 'TEXT') {
        await ingestIncomingText({
          fromWaId: ev.fromWaId,
          providerMessageId: ev.providerMessageId,
          contactName: ev.contactName,
          text: ev.text,
          createdAt: ev.timestamp,
        })

        continue
      }

      // ÁUDIO
      if (ev.type === 'AUDIO') {
        const contact = await upsertContactFromInbound({
          waId: ev.fromWaId,
          name: ev.contactName ?? null,
          phoneE164: ev.fromWaId,
        })

        const ticket = await findOrCreateOpenTicket(contact.id)

        const mediaUrlFromMeta = await getMediaUrl(ev.mediaId)
        if (!mediaUrlFromMeta) {
          console.warn('[WA WEBHOOK] não foi possível obter URL da mídia', {
            mediaId: ev.mediaId,
            providerMessageId: ev.providerMessageId,
          })
          continue
        }

        const buffer = await downloadMediaBuffer(mediaUrlFromMeta)

        const saved = await saveInboundAudioFile({
          buffer,
          mimeType: ev.mimeType || 'audio/ogg',
        })

        const inboundMessage = await storeInboundMessage({
          ticketId: ticket.id,
          providerMessageId: ev.providerMessageId,
          type: 'AUDIO',
          text: null,
          mediaUrl: saved.mediaUrl,
          mimeType: ev.mimeType || 'audio/ogg',
          createdAt: ev.timestamp || new Date(),
        })

        await bumpTicketWindow(ticket.id)

        const updatedTicket = await prisma.ticket.findUnique({
          where: { id: ticket.id },
          include: {
            contact: true,
            assignedTo: { select: { id: true, name: true, role: true } },
          },
        })

        bus.emit('message.created', {
          source: 'whatsapp.inbound.audio',
          ticket: updatedTicket,
          message: inboundMessage,
        })

        continue
      }
    }
  } catch (err) {
    console.error('[WA WEBHOOK] postWebhook error:', err?.message || err)
    console.error(err)
    return
  }
}

export async function postSendText(req, res, next) {
  try {
    const v = validateSendText(req.body)
    if (!v.ok) {
      return res.status(400).json(v)
    }

    const { contactId, toWaId, text } = v.data

    const ticket = await findOrCreateOpenTicket(contactId)
    const { messageId } = await sendTextMessage({ toWaId, text })

    const currentUser = req.user || req.authUser || null

    await storeOutboundMessageSent({
      ticketId: ticket.id,
      providerMessageId: messageId,
      type: 'TEXT',
      text,
      mediaUrl: null,
      mimeType: null,
      createdAt: new Date(),
      senderType: 'AGENT',
      senderUserId: currentUser?.id ?? null,
      senderName: currentUser?.name ?? null,
    })

    return res.json({ ok: true, ticketId: ticket.id, messageId })
  } catch (err) {
    return next(err)
  }
}

export async function postSendTemplateByPhone(req, res, next) {
  try {
    const { toWaId, templateName = 'hello_world', languageCode = 'en_US', components, name } = req.body

    const contact = await upsertContactFromInbound({
      waId: toWaId,
      name: name ?? null,
      phoneE164: toWaId,
    })

    const ticket = await findOrCreateOpenTicket(contact.id)

    const { messageId, raw } = await sendTemplateMessage({
      toWaId,
      templateName,
      languageCode,
      components,
    })

    const currentUser = req.user || req.authUser || null

    const msg = await storeOutboundMessageSent({
      ticketId: ticket.id,
      providerMessageId: messageId,
      type: 'TEXT',
      text: `[TEMPLATE:${templateName}]`,
      mediaUrl: null,
      mimeType: null,
      createdAt: new Date(),
      senderType: 'AGENT',
      senderUserId: currentUser?.id ?? null,
      senderName: currentUser?.name ?? null,
    })

    if (currentUser?.id) {
      await markTicketLastOutboundBy(ticket.id, currentUser)
    }

    await bumpTicketWindow(ticket.id)

    return res.json({
      ok: true,
      contactId: contact.id,
      ticketId: ticket.id,
      messageId,
      message: msg,
      raw,
    })
  } catch (err) {
    return next(err)
  }
}