import { Router } from 'express'
import { postWebhook } from './whatsapp.controller.js'
import { validate } from '../../middlewares/validate.js' // se você tiver esse validate
import { WhatsAppWebhookQuerySchema } from './whatsapp.schemas.js'
import { verifyMetaWebhookChallenge, verifyMetaSignature } from './whatsapp.verify.js'

export const router = Router()

// GET /webhooks/whatsapp?hub.mode=...&hub.verify_token=...&hub.challenge=...
router.get(
  '/',
  validate(WhatsAppWebhookQuerySchema), // se você não tiver validate, tire essa linha
  verifyMetaWebhookChallenge,
)

// POST /webhooks/whatsapp
router.post(
  '/',
  // verifyMetaSignature, // usa req.rawBody
  postWebhook,         // usa req.body
)