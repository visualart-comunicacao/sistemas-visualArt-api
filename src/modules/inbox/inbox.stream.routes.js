import { Router } from 'express'
import { sseAuthRequired } from '../../middlewares/auth-sse.js'
import { streamInbox } from './inbox.stream.controller.js'

export const router = Router()
router.get('/stream', sseAuthRequired, streamInbox)