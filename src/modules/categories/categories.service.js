import { CategoriesRepository } from './categories.repository.js';
import { makeSlug } from '../../utils/slug.js';

function notFound(msg = 'Category not found') {
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

export const CategoriesService = {
  async listPublic() {
    return CategoriesRepository.listPublic();
  },

  async create({ name }) {
    const slug = makeSlug(name);

    const exists = await CategoriesRepository.getBySlug(slug);
    if (exists) throw conflict('Category slug already exists');

    return CategoriesRepository.create({ name, slug });
  },

  async update(id, { name }) {
    const current = await CategoriesRepository.getById(id);
    if (!current) throw notFound();

    const slug = makeSlug(name);
    const sameSlug = await CategoriesRepository.getBySlug(slug);
    if (sameSlug && sameSlug.id !== id) throw conflict('Category slug already exists');

    return CategoriesRepository.update(id, { name, slug });
  },
};
