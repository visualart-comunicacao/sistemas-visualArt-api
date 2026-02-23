import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';

import { postSendText } from './whatsapp.controller.js';
import { WhatsAppSendTextSchema } from './whatsapp.schemas.js';
import { WhatsAppSendTextByPhoneSchema } from './whatsapp.schemas.js';
import { postSendTextByPhone } from './whatsapp.controller.js';
import { WhatsAppSendTemplateByPhoneSchema } from './whatsapp.schemas.js'
import { postSendTemplateByPhone } from './whatsapp.controller.js'

export const router = Router();

/**
 * POST /api/v1/whatsapp/messages/text
 */
router.post(
  '/messages/text',
  validate(WhatsAppSendTextSchema),
  postSendText,
);
router.post(
  '/messages/text-by-phone',
  validate(WhatsAppSendTextByPhoneSchema),
  postSendTextByPhone,
);
router.post(
  '/messages/template',
  validate(WhatsAppSendTemplateByPhoneSchema),
  postSendTemplateByPhone,
)