import crypto from 'crypto'
import { env } from '../../config/env.js'

// GET verification (challenge)
export function verifyMetaWebhookChallenge(req, res) {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === env.WA_VERIFY_TOKEN) {
    return res.status(200).send(String(challenge))
  }
  return res.sendStatus(403)
}

// POST signature validation (opcional)
export function verifyMetaSignature(req, res, next) {
  // Se você ainda não configurou WA_APP_SECRET, descomente o return next() pra testar:
  // return next()

  const signature = req.headers['x-hub-signature-256']
  if (!signature) return res.status(401).json({ message: 'Missing x-hub-signature-256' })

  const raw = req.rawBody
  if (!raw) return res.status(400).json({ message: 'Missing rawBody' })

  const expected =
    'sha256=' + crypto.createHmac('sha256', env.WA_APP_SECRET).update(raw).digest('hex')

  if (signature !== expected) {
    return res.status(401).json({ message: 'Invalid signature' })
  }

  return next()
}