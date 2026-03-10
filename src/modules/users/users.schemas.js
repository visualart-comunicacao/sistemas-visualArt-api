import { z } from 'zod';

export const ListUsersQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isActive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v === true || v === 'true') return true;
      if (v === false || v === 'false') return false;
      return undefined;
    }),
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