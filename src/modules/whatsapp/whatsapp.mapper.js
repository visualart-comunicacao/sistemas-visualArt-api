// src/modules/whatsapp/whatsapp.mapper.js

// Retorna lista de eventos normalizados:
// - mensagens inbound
// - status updates (quando você quiser tratar depois)
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
        let mediaId = null
        let mimeType = null

        if (m?.text?.body) {
          type = 'TEXT'
          text = String(m.text.body)
        } else if (m?.image) {
          type = 'IMAGE'
          mediaId = m.image?.id ? String(m.image.id) : null
          mimeType = m.image?.mime_type || null
        } else if (m?.audio) {
          type = 'AUDIO'
          mediaId = m.audio?.id ? String(m.audio.id) : null
          mimeType = m.audio?.mime_type || null
        } else if (m?.document) {
          type = 'DOCUMENT'
          mediaId = m.document?.id ? String(m.document.id) : null
          mimeType = m.document?.mime_type || null
        } else if (m?.video) {
          type = 'VIDEO'
          mediaId = m.video?.id ? String(m.video.id) : null
          mimeType = m.video?.mime_type || null
        } else if (m?.sticker) {
          type = 'STICKER'
          mediaId = m.sticker?.id ? String(m.sticker.id) : null
          mimeType = m.sticker?.mime_type || null
        }

        const contact = contactByWaId.get(from) || { waId: from, name: null }

        out.push({
          provider: 'meta',
          providerMessageId: id,
          fromWaId: from,
          contactName: contact.name,
          timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
          direction: 'IN',
          type,
          text,
          mediaId,
          mimeType,
          raw: m,
        })
      }

      const statuses = Array.isArray(value?.statuses) ? value.statuses : []
      for (const s of statuses) {
        const providerMessageId = s?.id ? String(s.id) : null
        const status = s?.status ? String(s.status).toUpperCase() : null

        if (!providerMessageId || !status) continue

        out.push({
          provider: 'meta',
          event: 'message_status',
          providerMessageId,
          status,
          raw: s,
        })
      }
    }
  }

  return out
}