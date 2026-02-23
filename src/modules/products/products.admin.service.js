import { prisma } from '../../db/prisma.js';

function parseBool(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

export const ProductsAdminService = {
  async list({ search, categoryId, active, pricingModel, hasStock, skip = 0, take = 20 }) {
    const activeBool = parseBool(active);
    const hasStockBool = parseBool(hasStock);

    const where = {
      ...(activeBool !== undefined ? { active: activeBool } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(pricingModel ? { pricingModel } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { category: { is: { name: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
      ...(hasStockBool === true
        ? { stock: { is: { quantity: { gt: 0 } } } }
        : hasStockBool === false
          ? { OR: [{ stock: { is: null } }, { stock: { is: { quantity: { lte: 0 } } } }] }
          : {}),
    };

    const include = {
      category: true,
      images: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] },
      stock: true,
      optionGroups: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          options: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
      _count: {
        select: {
          images: true,
          optionGroups: true,
          orderItems: true,
        },
      },
    };

    const [total, data] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    return { total, data };
  },

  async getById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] },
        stock: true,
        optionGroups: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            options: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
        _count: {
          select: {
            images: true,
            optionGroups: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      const err = new Error('Product not found');
      err.status = 404;
      err.name = 'NotFound';
      throw err;
    }

    return product;
  },
};
