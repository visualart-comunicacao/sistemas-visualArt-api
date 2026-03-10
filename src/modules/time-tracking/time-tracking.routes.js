import { Router } from 'express'
import { authRequired } from '../../middlewares/auth.js'
import * as controller from './time-tracking.controller.js'

export const router = Router()

router.use(authRequired)

router.post('/clock', controller.clock)
router.get('/me/today', controller.getToday)
router.get('/me/workdays', controller.getWorkdays)