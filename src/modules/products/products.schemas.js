import { z } from 'zod';

const PricingModel = z.enum(['UNIT', 'AREA_M2', 'LINEAR_M', 'QUOTE']);
const DimensionUnit = z.enum(['MM', 'CM']);
const PriceModifierType = z.enum(['FIXED_CENTS', 'PER_M2_CENTS', 'PERCENT']);

const UrlOrUploadPath = z
  .string()
  .min(1)
  .refine(
    (v) =>
      v.startsWith('/uploads/') ||
      v.startsWith('http://') ||
      v.startsWith('https://'),
    'Invalid url'
  );

export const ProductsListQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categorySlug: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const ProductCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    active: z.boolean().optional().default(true),
    categoryId: z.string().optional().nullable(),

    pricingModel: PricingModel.optional().default('AREA_M2'),
    dimensionUnit: DimensionUnit.optional().default('CM'),
    minWidth: z.number().int().positive().optional().nullable(),
    maxWidth: z.number().int().positive().optional().nullable(),
    minHeight: z.number().int().positive().optional().nullable(),
    maxHeight: z.number().int().positive().optional().nullable(),
    step: z.number().int().positive().optional().nullable(),

    minAreaM2: z.number().positive().optional().nullable(),
    minPriceCents: z.number().int().nonnegative().optional().nullable(),

    baseUnitPriceCents: z.number().int().nonnegative().optional().nullable(),
    baseM2PriceCents: z.number().int().nonnegative().optional().nullable(),
    baseLinearMPriceCents: z.number().int().nonnegative().optional().nullable(),
  }),
});

export const ProductUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: ProductCreateSchema.shape.body.partial().refine((v) => Object.keys(v).length > 0, 'Envie ao menos um campo'),
});

export const ProductBySlugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const ProductAddImageSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({
    url: UrlOrUploadPath,
    alt: z.string().optional(),
    isCover: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const ProductAddOptionGroupSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2),
    required: z.boolean().optional().default(false),
    minSelect: z.number().int().min(0).optional().default(0),
    maxSelect: z.number().int().min(1).optional().default(1),
    sortOrder: z.number().int().min(0).optional().default(0),
  }),
});

export const GroupAddOptionSchema = z.object({
  params: z.object({ groupId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2),
    active: z.boolean().optional().default(true),
    sortOrder: z.number().int().min(0).optional().default(0),
    modifierType: PriceModifierType.optional().default('FIXED_CENTS'),
    modifierValue: z.number().int().optional().default(0),
  }),
});

export const StockUpdateSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({
    quantity: z.number().int().min(0),
  }),
});
