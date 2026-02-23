// src/modules/whatsapp/whatsapp.routes.js
import { Router } from 'express'
import { postWebhook } from './whatsapp.controller.js'
import { validate } from '../../middlewares/validate.js'
import { WhatsAppWebhookQuerySchema } from './whatsapp.schemas.js'
import { verifyMetaWebhookChallenge, verifyMetaSignature } from './whatsapp.verify.js'
import { env } from '../../config/env.js'

export const router = Router()

router.get('/', validate(WhatsAppWebhookQuerySchema), verifyMetaWebhookChallenge)

// POST /webhooks/whatsapp
router.post(
  '/',
  // Em dev você consegue testar via Insomnia sem header;
  // Em produção, valida assinatura da Meta.
  (req, res, next) => {
    if (env.NODE_ENV === 'development') return next()
    return verifyMetaSignature(req, res, next)
  },
  postWebhook,
)