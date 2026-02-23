import { z } from 'zod';

export const WhatsAppSendTextSchema = z.object({
  body: z.object({
    contactId: z.string().min(1),
    toWaId: z.string().min(8),
    text: z.string().min(1).max(4096),
  }),
});

export const WhatsAppWebhookQuerySchema = z.object({
  query: z.object({
    'hub.mode': z.string(),
    'hub.verify_token': z.string(),
    'hub.challenge': z.string(),
  }),
});

export const WhatsAppSendTextByPhoneSchema = z.object({
  body: z.object({
    toWaId: z.string().min(8),
    text: z.string().min(1).max(4096),
    name: z.string().optional(), // opcional
  }),
});

export const WhatsAppSendTemplateByPhoneSchema = z.object({
  body: z.object({
    toWaId: z.string().min(8),
    templateName: z.string().min(1).default('hello_world'),
    languageCode: z.string().min(2).default('en_US'),
    // opcional: componentes (para templates com variáveis)
    components: z.array(z.any()).optional(),
    name: z.string().optional(),
  }),
})