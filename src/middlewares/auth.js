import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authRequired(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    const err = new Error('Missing Bearer token');
    err.status = 401;
    err.name = 'Unauthorized';
    return next(err);
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.auth = payload; // { sub, role }

    // ✅ ADICIONE ISTO:
    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    return next();
  } catch {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    err.name = 'Unauthorized';
    return next(err);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    const role = req.auth?.role;
    if (!role || !roles.includes(role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      err.name = 'Forbidden';
      return next(err);
    }
    return next();
  };
}
