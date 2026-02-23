import { Router } from 'express'
import {
  listTickets,
  getMessages,
  assignTicket,
  closeTicket,
  sendMessage,
  sendVoiceMessage
} from './inbox.controller.js'
import { updateContact } from './contacts.controller.js'
import { authRequired } from '../../middlewares/auth.js'

export const router = Router()

router.use(authRequired)

router.get('/tickets', listTickets)
router.get('/tickets/:ticketId/messages', getMessages)
router.patch('/tickets/:ticketId/assign', assignTicket)
router.patch('/tickets/:ticketId/close', closeTicket)
router.post('/tickets/:ticketId/messages', sendMessage)
router.patch('/contacts/:contactId', updateContact)
router.post('/tickets/:ticketId/voice', sendVoiceMessage)