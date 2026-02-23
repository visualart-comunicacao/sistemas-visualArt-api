// src/modules/whatsapp/whatsapp.validator.js
import { z } from 'zod'

export const SendTextSchema = z.object({
  contactId: z.string().min(1),
  toWaId: z.string().min(8),
  text: z.string().min(1).max(4096),
})

export function validateSendText(body) {
  const parsed = SendTextSchema.safeParse(body)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation error',
      details: parsed.error.flatten(),
    }
  }
  return { ok: true, data: parsed.data }
}