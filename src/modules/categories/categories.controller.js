import { CategoriesService } from './categories.service.js';

export const CategoriesController = {
  async listPublic(_req, res, next) {
    try {
      const data = await CategoriesService.listPublic();
      res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const created = await CategoriesService.create(req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.validated.params;
      const updated = await CategoriesService.update(id, req.validated.body);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
};
