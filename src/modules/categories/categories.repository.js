import { prisma } from '../../db/prisma.js';

export const CategoriesRepository = {
  listPublic() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  },

  getById(id) {
    return prisma.category.findUnique({ where: { id } });
  },

  getBySlug(slug) {
    return prisma.category.findUnique({ where: { slug } });
  },

  create(data) {
    return prisma.category.create({ data });
  },

  update(id, data) {
    return prisma.category.update({ where: { id }, data });
  },
};
