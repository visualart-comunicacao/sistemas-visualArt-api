import * as service from './inbox.service.js'

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
    if (!ticketId) return res.status(400).json({ message: 'ticketId é obrigatório.' })

    const ticket = await service.assignTicket({
      ticketId,
      actor: req.user,
      toUserId: userId ? String(userId) : null,
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