import { logger } from '../config/logger.js';

export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500;

  if (status >= 500) {
    logger.error({ err }, 'Unhandled error');
  }

  res.status(status).json({
    error: err.name ?? 'Error',
    message: err.message ?? 'Internal Server Error',
    details: err.details ?? undefined,
  });
}
