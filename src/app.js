import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { logger } from './config/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

import { router as whatsappWebhookRoutes } from './modules/whatsapp/whatsapp.routes.js';

import { router as v1Router } from './routes/v1.js';

export function buildApp() {
  const app = express()

  app.disable('x-powered-by')

  // ✅ JSON + rawBody pra TODO o app (inclui webhook)
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf
      },
    }),
  )

  app.use(express.urlencoded({ extended: true }))

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(cors({ origin: true }))

  // ✅ webhook
  app.use('/webhooks/whatsapp', whatsappWebhookRoutes)

  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }),
  )

  // se precisar forms:
  app.use(express.urlencoded({ extended: true }))

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin: true }));

  // ✅ 1) Webhook WhatsApp ANTES do JSON global (para preservar rawBody e validar assinatura)
  app.use('/webhooks/whatsapp', whatsappWebhookRoutes);

  // ✅ 2) JSON global para o resto da API


  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }),
  );

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/v1', v1Router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
