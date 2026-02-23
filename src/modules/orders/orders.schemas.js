import { z } from 'zod';

export const OrderCreateSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(999),

          // dimensões (em CM/MM conforme produto)
          width: z.number().int().positive().optional().nullable(),
          height: z.number().int().positive().optional().nullable(),

          optionIds: z.array(z.string().min(1)).optional().default([]),
        }),
      )
      .min(1),
  }),
});

export const OrdersMeQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
