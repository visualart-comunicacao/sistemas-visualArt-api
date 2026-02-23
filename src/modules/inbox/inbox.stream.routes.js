import { Router } from 'express'
import { authSSE } from '../../middlewares/auth-sse.js'
import { streamInbox } from './inbox.stream.controller.js'

export const router = Router()

// ✅ SSE precisa aceitar query token
router.get('/stream', authSSE, streamInbox)