// src/modules/whatsapp/whatsapp.controller.js
import { parseWebhookEvents } from './whatsapp.mapper.js'
import { validateSendText } from './whatsapp.validator.js'
import {
  upsertContactFromInbound,
  findOrCreateOpenTicket,
  storeOutboundMessageSent,
  bumpTicketWindow,
  sendTextMessage,
  getMediaUrl,
  updateMessageStatus,
  sendTemplateMessage
} from './whatsapp.service.js'
import { ingestIncomingText } from './whatsapp.inbox.service.js'

export async function postSendTextByPhone(req, res, next) {
  try {
    const { toWaId, text, name } = req.body;

    // 1) garante Contact (mesmo se nunca falou antes)
    const contact = await upsertContactFromInbound({
      waId: toWaId,
      name: name ?? null,
      phoneE164: toWaId,
    });

    // 2) garante Ticket OPEN
    const ticket = await findOrCreateOpenTicket(contact.id);

    // 3) envia via Meta
    const { messageId, raw } = await sendTextMessage({ toWaId, text });

    // 4) salva OUT
    const msg = await storeOutboundMessageSent({
      ticketId: ticket.id,
      providerMessageId: messageId,
      type: 'TEXT',
      text,
      mediaUrl: null,
      mimeType: null,
      createdAt: new Date(),
    });

    // 5) atualiza janela
    await bumpTicketWindow(ticket.id);

    return res.json({
      ok: true,
      contactId: contact.id,
      ticketId: ticket.id,
      messageId,
      message: msg,
      raw,
    });
  } catch (err) {
    return next(err);
  }
}

export async function postWebhook(req, res, next) {
  // responda rápido pra Meta não ficar retentando
  res.sendStatus(200)

  try {
    const payload = req.body

    if (!payload || typeof payload !== 'object') {
      console.warn('[WA WEBHOOK] req.body inválido (não parseado). content-type:', req.headers['content-type'])
      console.warn('[WA WEBHOOK] body:', payload)
      return
    }

    const events = parseWebhookEvents(payload)

    // ✅ aqui você pode chamar seu service que salva no banco
    // por enquanto, só loga pra garantir que parou o 500
    for (const ev of events) {
  // só texto IN por enquanto
  if (ev.direction !== 'IN') continue
  if (ev.type !== 'TEXT') continue

  await ingestIncomingText({
    fromWaId: ev.fromWaId,
    providerMessageId: ev.providerMessageId,
    contactName: ev.contactName,
    text: ev.text,
    createdAt: ev.timestamp,
  })
}
  } catch (err) {
    console.error('[WA WEBHOOK] postWebhook error:', err?.message || err)
    console.error(err)
    // como já respondemos 200, só loga
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

    // 1) ticket
    const ticket = await findOrCreateOpenTicket(contactId)
    const { messageId } = await sendTextMessage({ toWaId, text })

    await storeOutboundMessageSent({
      ticketId: ticket.id,
      providerMessageId: messageId,
      type: 'TEXT',
      text,
      mediaUrl: null,
      mimeType: null,
      createdAt: new Date(),
    })

    return res.json({ ok: true, ticketId: ticket.id, messageId })
  } catch (err) {
    return next(err)
  }
}

export async function postSendTemplateByPhone(req, res, next) {
  try {
    const { toWaId, templateName = 'hello_world', languageCode = 'en_US', components, name } = req.body

    // 1) garante Contact
    const contact = await upsertContactFromInbound({
      waId: toWaId,
      name: name ?? null,
      phoneE164: toWaId,
    })

    // 2) garante Ticket OPEN
    const ticket = await findOrCreateOpenTicket(contact.id)

    // 3) envia template via Meta
    const { messageId, raw } = await sendTemplateMessage({
      toWaId,
      templateName,
      languageCode,
      components,
    })

    // 4) salva OUT
    const msg = await storeOutboundMessageSent({
      ticketId: ticket.id,
      providerMessageId: messageId,
      type: 'TEXT', // template ainda é uma mensagem "texto" para o nosso chat
      text: `[TEMPLATE:${templateName}]`,
      mediaUrl: null,
      mimeType: null,
      createdAt: new Date(),
    })

    // 5) bump janela
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