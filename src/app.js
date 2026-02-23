// src/app.js
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import { notFound } from './middlewares/not-found.js'
import { errorHandler } from './middlewares/error-handler.js'
import { logger } from './config/logger.js'

import { router as whatsappWebhookRoutes } from './modules/whatsapp/whatsapp.routes.js'
import { router as v1Router } from './routes/v1.js'

export function buildApp() {
  const app = express()
  app.disable('x-powered-by')

  // 1) Webhook WhatsApp com JSON + rawBody (precisa do verify)
  app.use(
    '/webhooks/whatsapp',
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf
      },
    }),
    whatsappWebhookRoutes,
  )

  // 2) JSON normal para o resto da API
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(cors({ origin: true }))

  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }),
  )

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/v1', v1Router)

  app.use(notFound)
  app.use(errorHandler)

  return app
}