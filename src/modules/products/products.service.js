import { ProductsRepository } from './products.repository.js';
import { prisma } from '../../db/prisma.js';
import { makeSlug } from '../../utils/slug.js';

function notFound(msg = 'Product not found') {
  const err = new Error(msg);
  err.status = 404;
  err.name = 'NotFound';
  return err;
}

function conflict(msg) {
  const err = new Error(msg);
  err.status = 409;
  err.name = 'Conflict';
  return err;
}

function validateGroupRules({ required, minSelect, maxSelect }) {
  const min = minSelect ?? 0;
  const max = maxSelect ?? 1;
  const req = required ?? false;

  if (min < 0 || max < 0) throw conflict('minSelect/maxSelect must be >= 0');
  if (max < min) throw conflict('maxSelect must be >= minSelect');
  if (req && min === 0) throw conflict('required=true requires minSelect >= 1');
}

export const ProductsService = {
  async listPublic({ search, categorySlug, skip, take }) {
    const where = {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(categorySlug ? { category: { is: { slug: categorySlug } } } : {}),
    };

    return ProductsRepository.listPublic({ where, skip, take });
  },

  async getBySlug(slug) {
    const product = await ProductsRepository.getBySlug(slug);
    if (!product || !product.active) throw notFound();
    return product;
  },

  async create(payload) {
    const slug = payload.slug ? makeSlug(payload.slug) : makeSlug(payload.name);

    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) throw conflict('Product slug already exists');

    const created = await ProductsRepository.create({ ...payload, slug });
    await ProductsRepository.upsertStock(created.id, 0);
    return created;
  },

  async update(id, payload) {
    const current = await ProductsRepository.getById(id);
    if (!current) throw notFound();

    const data = { ...payload };

    if (payload.slug) {
      const slug = makeSlug(payload.slug);
      const sameSlug = await prisma.product.findUnique({ where: { slug } });
      if (sameSlug && sameSlug.id !== id) throw conflict('Product slug already exists');
      data.slug = slug;
    }

    return ProductsRepository.update(id, data);
  },

  async addImage(productId, payload) {
    const product = await ProductsRepository.getById(productId);
    if (!product) throw notFound();

    return ProductsRepository.addImage(productId, payload);
  },

  async addOptionGroup(productId, payload) {
    const product = await ProductsRepository.getById(productId);
    if (!product) throw notFound();

    validateGroupRules(payload);

    return ProductsRepository.addOptionGroup(productId, payload);
  },

  async addOption(groupId, payload) {
    const group = await prisma.productOptionGroup.findUnique({ where: { id: groupId } });
    if (!group) throw notFound('Option group not found');

    return ProductsRepository.addOption(groupId, payload);
  },

  async updateStock(productId, quantity) {
    const product = await ProductsRepository.getById(productId);
    if (!product) throw notFound();

    return ProductsRepository.upsertStock(productId, quantity);
  },
};
