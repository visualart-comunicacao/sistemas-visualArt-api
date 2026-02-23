import { z } from 'zod';

export const AdminProductsListSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    active: z.enum(['true', 'false']).optional(),
    pricingModel: z.enum(['UNIT', 'AREA_M2', 'LINEAR_M', 'QUOTE']).optional(),
    hasStock: z.enum(['true', 'false']).optional(), // true => stock.quantity > 0
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const AdminProductGetByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
