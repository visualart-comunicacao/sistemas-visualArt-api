import { prisma } from '../../db/prisma.js'

export async function updateContact(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado.' })

    const { contactId } = req.params
    const { name } = req.body || {}

    if (!contactId) return res.status(400).json({ message: 'contactId é obrigatório.' })

    const updated = await prisma.contact.update({
      where: { id: String(contactId) },
      data: {
        name: name ? String(name).trim() : null,
      },
    })

    return res.json({ contact: updated })
  } catch (err) {
    next(err)
  }
}