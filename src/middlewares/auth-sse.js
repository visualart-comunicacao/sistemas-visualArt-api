import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function sseAuthRequired(req, _res, next) {
  const token = String(req.query.access_token || req.query.token || '')
  if (!token) {
    const err = new Error('Missing token')
    err.status = 401
    return next(err)
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role }
    return next()
  } catch {
    const err = new Error('Invalid or expired token')
    err.status = 401
    return next(err)
  }
}