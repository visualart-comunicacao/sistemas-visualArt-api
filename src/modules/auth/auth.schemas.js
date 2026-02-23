import { z } from 'zod';

export const RegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().min(8).optional(),
    document: z.string().min(5).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
