import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function authSSE(req, _res, next) {
  // aceita:
  // 1) Authorization: Bearer <token> (útil para testes via curl)
  // 2) ?access_token=<token> (necessário para EventSource)
  const header = req.headers.authorization
  const queryToken = req.query?.access_token

  let token = null

  if (header && header.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length)
  } else if (queryToken) {
    token = String(queryToken)
  }

  if (!token) {
    return next(Object.assign(new Error('Missing Bearer token'), { status: 401, name: 'Unauthorized' }))
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    req.auth = payload // { sub, role }
    return next()
  } catch {
    return next(Object.assign(new Error('Invalid or expired token'), { status: 401, name: 'Unauthorized' }))
  }
}