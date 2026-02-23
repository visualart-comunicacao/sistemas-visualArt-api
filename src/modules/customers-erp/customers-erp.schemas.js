import { z } from 'zod';

/**
 * Enums (alinhados com seu Prisma)
 */
const CustomerType = z.enum(['PERSON', 'BUSINESS']);
const Gender = z.enum(['NOT_INFORMED', 'MALE', 'FEMALE', 'OTHER']);
const AddressType = z.enum(['SHIPPING', 'BILLING']);

const OrderType = z.enum(['QUOTE', 'SALE', 'INTERNAL']);
const OrderStatus = z.enum(['PENDING', 'PAID', 'CANCELED', 'SHIPPED', 'DELIVERED']);
const PaymentStatus = z.enum(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED', 'CANCELED']);

/**
 * Address input (para criar novo endereço e opcionalmente marcar como default)
 */
export const AddressInput = z.object({
  type: AddressType.optional().default('SHIPPING'),
  isDefault: z.boolean().optional().default(true),

  label: z.string().optional().nullable(),
  recipient: z.string().optional().nullable(),

  zipCode: z.string().min(5),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional().nullable(),
  district: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2).max(2),

  reference: z.string().optional().nullable(),
});

/**
 * Base payload do cliente ERP (User + CustomerProfile + (opcional) Address)
 * - email/document agora existem no seu service e no model User
 * - isActive/isBlocked/marketingOptIn etc
 * - PF e PJ completos
 */
export const CustomerErpInput = z.object({
  // User
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  document: z.string().optional().nullable(), // campo livre (cpf/cnpj/etc se quiser)
  isActive: z.boolean().optional().default(true),

  // Profile
  type: CustomerType.optional().default('PERSON'),

  // PF
  fullName: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable(), // ISO string
  gender: Gender.optional().default('NOT_INFORMED'),
  cpf: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),

  // PJ
  cnpj: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  tradeName: z.string().optional().nullable(),
  stateTaxId: z.string().optional().nullable(),
  municipalTaxId: z.string().optional().nullable(),

  // Contato extra
  phone2: z.string().optional().nullable(),
  whatsapp: z.boolean().optional().default(true),

  // Preferências / controle
  marketingOptIn: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
  isBlocked: z.boolean().optional().default(false),

  // Endereço (cria um novo endereço e pode setar default)
  address: AddressInput.optional(),
});

/**
 * Create
 */
export const CustomerErpCreateSchema = z.object({
  body: CustomerErpInput,
});

/**
 * List (query)
 */
export const CustomerErpListSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    type: CustomerType.optional(),
    isBlocked: z.enum(['true', 'false']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

/**
 * Get by id
 */
export const CustomerErpGetByIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

/**
 * Update (PATCH) - ao menos 1 campo
 */
export const CustomerErpUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: CustomerErpInput.partial().refine((v) => Object.keys(v).length > 0, 'Envie ao menos um campo'),
});

/**
 * Set active (ativar/desativar)
 */
export const CustomerErpSetActiveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

/**
 * Set blocked (bloquear/desbloquear)
 */
export const CustomerErpSetBlockedSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    isBlocked: z.boolean(),
  }),
});

/**
 * List orders for a customer
 */
export const CustomerErpOrdersListSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({
    type: OrderType.optional(),
    status: OrderStatus.optional(),
    paymentStatus: PaymentStatus.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

/**
 * Summary
 */
export const CustomerErpSummarySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
