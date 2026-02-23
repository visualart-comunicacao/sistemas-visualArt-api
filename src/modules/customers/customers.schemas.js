import { z } from 'zod';

const onlyDigits = (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);

const CustomerType = z.enum(['PERSON', 'BUSINESS']);
const Gender = z.enum(['NOT_INFORMED', 'MALE', 'FEMALE', 'OTHER']);
const AddressType = z.enum(['SHIPPING', 'BILLING']);

const AddressInput = z.object({
  type: AddressType.optional().default('SHIPPING'),
  isDefault: z.boolean().optional().default(false),

  label: z.string().optional(),
  recipient: z.string().optional(),

  zipCode: z.string().transform(onlyDigits).refine((v) => v.length === 8, 'zipCode inválido'),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  reference: z.string().optional(),
});

const BillingAddressInput = z.union([
  z.object({ sameAsShipping: z.literal(true) }),
  z.object({ sameAsShipping: z.literal(false) }).merge(AddressInput),
]);

const CustomerProfileBase = z.object({
  type: CustomerType,

  // PF
  fullName: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  gender: Gender.optional().default('NOT_INFORMED'),

  // PJ
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
  stateTaxId: z.string().optional(),
  municipalTaxId: z.string().optional(),

  // Docs
  cpf: z.string().transform(onlyDigits).optional(),
  cnpj: z.string().transform(onlyDigits).optional(),
  rg: z.string().optional(),

  // Contato
  phone2: z.string().transform(onlyDigits).optional(),
  whatsapp: z.boolean().optional().default(true),

  // LGPD
  marketingOptIn: z.boolean().optional().default(false),
  termsAcceptedAt: z.string().datetime().optional(),

  notes: z.string().optional(),
});

const CustomerProfileInput = CustomerProfileBase.superRefine((data, ctx) => {
  if (data.type === 'PERSON') {
    if (!data.fullName)
      ctx.addIssue({ code: 'custom', message: 'fullName é obrigatório para PERSON', path: ['fullName'] });
    if (!data.cpf)
      ctx.addIssue({ code: 'custom', message: 'cpf é obrigatório para PERSON', path: ['cpf'] });
    if (data.cpf && data.cpf.length !== 11)
      ctx.addIssue({ code: 'custom', message: 'cpf inválido', path: ['cpf'] });
    if (data.cnpj)
      ctx.addIssue({ code: 'custom', message: 'cnpj não deve ser enviado para PERSON', path: ['cnpj'] });
  }

  if (data.type === 'BUSINESS') {
    if (!data.companyName)
      ctx.addIssue({ code: 'custom', message: 'companyName é obrigatório para BUSINESS', path: ['companyName'] });
    if (!data.cnpj)
      ctx.addIssue({ code: 'custom', message: 'cnpj é obrigatório para BUSINESS', path: ['cnpj'] });
    if (data.cnpj && data.cnpj.length !== 14)
      ctx.addIssue({ code: 'custom', message: 'cnpj inválido', path: ['cnpj'] });
    if (data.cpf)
      ctx.addIssue({ code: 'custom', message: 'cpf não deve ser enviado para BUSINESS', path: ['cpf'] });
  }
});


export const CustomerRegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    profile: CustomerProfileInput,
    shippingAddress: AddressInput,
    billingAddress: BillingAddressInput.optional().default({ sameAsShipping: true }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const CustomerMeUpdateSchema = z.object({
  body: CustomerProfileBase.partial().refine((v) => Object.keys(v).length > 0, 'Envie ao menos um campo'),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const AddressCreateSchema = z.object({
  body: AddressInput,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const AddressUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: AddressInput.partial().refine((v) => Object.keys(v).length > 0, 'Envie ao menos um campo'),
  query: z.object({}).optional(),
});

export const AddressIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const AddressSetDefaultSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ type: AddressType }),
  query: z.object({}).optional(),
});
