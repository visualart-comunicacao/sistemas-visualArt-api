import * as service from './inbox.service.js'
import { uploadVoice } from '../../middlewares/upload-voice.js'

function parseIntSafe(v, fallback) {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

function normalizeQueue(raw) {
  const q = String(raw ?? 'meus').trim().toLowerCase()
  if (q === 'meus') return 'meus'
  if (q === 'espera') return 'espera'
  if (q === 'todos') return 'todos'
  return 'meus'
}

export const sendVoiceMessage = [
  uploadVoice.single('file'),
  async (req, res, next) => {
    try {
      console.log('entrei no controller de voz')
      console.log('req.params =', req.params)
      console.log('req.user =', req.user)
      console.log('req.file =', req.file)
      console.log('req.body =', req.body)

      const { ticketId } = req.params
      const userId = req.user?.id
      const file = req.file

      if (!file) {
        return res.status(400).json({ message: 'Arquivo de áudio não enviado (field: file).' })
      }

      const mediaUrl = `/uploads/voices/${file.filename}`

      const durationMs = Number.isFinite(Number(req.body?.durationMs))
        ? Number(req.body.durationMs)
        : Number.isFinite(Number(req.body?.durationSec))
          ? Number(req.body.durationSec) * 1000
          : null

      const payload = {
        ticketId,
        userId,
        userName: req.user?.name ?? null,
        mediaUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        durationMs,
      }

      console.log('payload createVoiceOutMessage =', payload)

      const msg = await service.createVoiceOutMessage(payload)

      console.log('msg criada =', msg)

      return res.status(201).json(msg)
    } catch (err) {
      console.log('Error in sendVoiceMessage:', err)
      next(err)
    }
  }
]

export async function listTickets(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado.' })

    const queue = normalizeQueue(req.query.queue)
    const take = Math.min(parseIntSafe(req.query.take, 30), 100)
    const skip = Math.max(parseIntSafe(req.query.skip, 0), 0)
    const isAdmin = req.user?.role === 'ADMIN'

    const result = await service.listTickets({
      queue,
      userId: req.user.id,
      isAdmin,
      take,
      skip,
    })

    return res.json({
      items: result.items,
      total: result.total,
      meta: { queue, take, skip },
    })
  } catch (err) {
    next(err)
  }
}

export async function getMessages(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado.' })

    const { ticketId } = req.params
    if (!ticketId) return res.status(400).json({ message: 'ticketId é obrigatório.' })

    const items = await service.getMessages(ticketId)
    return res.json({ items })
  } catch (err) {
    next(err)
  }
}

export async function assignTicket(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado.' })

    const { ticketId } = req.params
    const { userId } = req.body || {}
    const toUserId = userId ? String(userId) : String(req.user.id)
    if (!ticketId) return res.status(400).json({ message: 'ticketId é obrigatório.' })

    const ticket = await service.assignTicket({
      ticketId,
      actor: req.user,
      toUserId,
    })

    return res.json({ ticket })
  } catch (err) {
    next(err)
  }
}

export async function closeTicket(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado.' })

    const { ticketId } = req.params
    if (!ticketId) return res.status(400).json({ message: 'ticketId é obrigatório.' })

    const ticket = await service.closeTicket({ ticketId, actor: req.user })
    return res.json({ ticket })
  } catch (err) {
    next(err)
  }
}

export async function sendMessage(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado.' })

    const { ticketId } = req.params
    const { text } = req.body || {}

    if (!ticketId) return res.status(400).json({ message: 'ticketId é obrigatório.' })
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ message: 'text é obrigatório.' })
    }

    const message = await service.sendMessage({
      ticketId,
      actor: req.user,
      text: String(text).trim(),
    })

    return res.status(201).json({ message })
  } catch (err) {
    next(err)
  }
}

export async function listAgents(req, res, next) {
  try {
    const items = await service.listAgents()
    return res.json({ items })
  } catch (err) {
    next(err)
  }
}