import { z } from 'zod';

const OrderStatus = z.enum(['PENDING', 'PAID', 'CANCELED', 'SHIPPED', 'DELIVERED']);

const isoDate = z
  .string()
  .datetime({ offset: true })
  .transform((v) => new Date(v));

export const QuotesListQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(), // opcional (se quiser implementar)
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const QuoteGetSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const QuoteCreateSchema = z.object({
  body: z.object({
    customerUserId: z.string().min(1),

    discountCents: z.number().int().min(0).optional(),
    shippingCents: z.number().int().min(0).optional(),
    taxCents: z.number().int().min(0).optional(),

    notes: z.string().max(5000).optional(),
    internalNotes: z.string().max(5000).optional(),

    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive(),
          width: z.number().int().positive().optional().nullable(),
          height: z.number().int().positive().optional().nullable(),
          optionIds: z.array(z.string()).optional().default([]),
        }),
      )
      .min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const QuoteApproveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      approved: z.boolean().optional().default(true),
      notes: z.string().max(5000).optional(),
      internalNotes: z.string().max(5000).optional(),
    })
    .optional()
    .default({}),
  query: z.object({}).optional(),
});

export const QuoteCancelSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      reason: z.string().max(2000).optional(),
      internalNotes: z.string().max(5000).optional(),
    })
    .optional()
    .default({}),
  query: z.object({}).optional(),
});

export const QuoteConvertSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z
    .object({
      saleStatus: OrderStatus.optional().default('PENDING'),
      requireApproved: z.boolean().optional().default(true),
      force: z.boolean().optional().default(false),

      createWorkOrder: z.boolean().optional().default(true),

      workOrder: z
        .object({
          dueAt: isoDate.optional().nullable(),
          priority: z.number().int().min(0).max(10).optional().default(0),
          instructions: z.string().max(8000).optional().nullable(),
          internalNotes: z.string().max(8000).optional().nullable(),
        })
        .optional()
        .default({}),
    })
    .optional()
    .default({}),
  query: z.object({}).optional(),
});

export const QuoteUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    // você pode trocar cliente antes de aprovar
    customerUserId: z.string().min(1).optional(),

    discountCents: z.number().int().min(0).optional(),
    shippingCents: z.number().int().min(0).optional(),
    taxCents: z.number().int().min(0).optional(),

    notes: z.string().max(5000).optional().nullable(),
    internalNotes: z.string().max(5000).optional().nullable(),

    items: z.array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        width: z.number().int().positive().optional().nullable(),
        height: z.number().int().positive().optional().nullable(),
        optionIds: z.array(z.string()).optional().default([]),
      }),
    ).min(1).optional(),
  }),
  query: z.object({}).optional(),
})

