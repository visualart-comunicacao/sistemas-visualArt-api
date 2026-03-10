import { z } from 'zod';

export const ListUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const GetUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID obrigatório'),
  }),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  isActive: z.boolean().optional().default(true),
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),

  employeeProfile: z
    .object({
      role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional().default('EMPLOYEE'),
      active: z.boolean().optional().default(true),
      department: z.string().nullable().optional(),
      unit: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
    })
    .optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),

  employeeProfile: z
    .object({
      role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
      active: z.boolean().optional(),
      department: z.string().nullable().optional(),
      unit: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
    })
    .optional(),
});

export const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});