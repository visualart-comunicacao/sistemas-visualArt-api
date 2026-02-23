// src/modules/whatsapp/whatsapp.mapper.js

// Retorna lista de eventos normalizados:
// - inbound_message: mensagem recebida
// - message_status: status update (delivered/read/failed/sent)
/**
 * Converte payload da Meta em uma lista simples de eventos.
 * Inicial: foca em messages IN (text).
 */
export function parseWebhookEvents(payload) {
  const out = []

  const entries = Array.isArray(payload?.entry) ? payload.entry : []
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const value = change?.value
      if (!value) continue

      const messages = Array.isArray(value?.messages) ? value.messages : []
      const contacts = Array.isArray(value?.contacts) ? value.contacts : []

      // map: wa_id -> profile name
      const contactByWaId = new Map()
      for (const c of contacts) {
        const waId = c?.wa_id ? String(c.wa_id) : null
        const name = c?.profile?.name || null
        if (waId) contactByWaId.set(waId, { waId, name })
      }

      for (const m of messages) {
        const from = m?.from ? String(m.from) : null
        const id = m?.id ? String(m.id) : null
        const timestamp = m?.timestamp ? Number(m.timestamp) : null

        if (!from || !id) continue

        let type = 'UNKNOWN'
        let text = null

        if (m?.text?.body) {
          type = 'TEXT'
          text = String(m.text.body)
        } else if (m?.image) type = 'IMAGE'
        else if (m?.audio) type = 'AUDIO'
        else if (m?.document) type = 'DOCUMENT'
        else if (m?.video) type = 'VIDEO'
        else if (m?.sticker) type = 'STICKER'

        const contact = contactByWaId.get(from) || { waId: from, name: null }

        out.push({
          provider: 'meta',
          providerMessageId: id,
          fromWaId: from,
          contactName: contact.name,
          timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
          direction: 'IN',
          type,
          text,
          raw: m, // útil pra debug
        })
      }
    }
  }

  return out
}