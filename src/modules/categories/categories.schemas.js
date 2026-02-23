import { z } from 'zod';

export const CategoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const CategoryUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2),
  }),
  query: z.object({}).optional(),
});
