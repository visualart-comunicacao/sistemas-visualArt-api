import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './db/prisma.js';

const app = buildApp();

async function main() {
  await prisma.$connect();
  logger.info('Connected to PostgreSQL via Prisma');

  app.listen(env.PORT, () => {
    logger.info(`API running on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  logger.error(e, 'Failed to start server');
  process.exit(1);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
