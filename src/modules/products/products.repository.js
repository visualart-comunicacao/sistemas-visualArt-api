import { prisma } from '../../db/prisma.js'

export const ProductsRepository = {
  // ✅ ADMIN: usado por /admin/products/:id (ERP)
  getById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { createdAt: 'asc' } },
        stock: true,
        optionGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    })
  },

  // ✅ Público: produto por slug (site/ecommerce)
  getBySlug(slug) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { createdAt: 'asc' } },
        optionGroups: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
        stock: true,
      },
    })
  },

  async listPublic({ where, skip, take }) {
    const [total, data] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
          pricingModel: true,
          minPriceCents: true,
          baseUnitPriceCents: true,
          baseM2PriceCents: true,
          baseLinearMPriceCents: true,
          category: { select: { id: true, name: true, slug: true } },
          images: {
            take: 1,
            orderBy: { createdAt: 'asc' },
            select: { url: true, alt: true },
          },
        },
      }),
    ])

    return { total, data }
  },

  create(data) {
    return prisma.product.create({ data })
  },

  update(id, data) {
    return prisma.product.update({ where: { id }, data })
  },

  addImage(productId, data) {
    return prisma.productImage.create({ data: { ...data, productId } })
  },

  addOptionGroup(productId, data) {
    return prisma.productOptionGroup.create({ data: { ...data, productId } })
  },

  addOption(groupId, data) {
    return prisma.productOption.create({ data: { ...data, groupId } })
  },

  upsertStock(productId, quantity) {
    return prisma.stock.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
    })
  },
}
