import { ProductsService } from './products.service.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

export const ProductsController = {
  async listPublic(req, res, next) {
    try {
      const { page, pageSize, skip, take } = getPagination(req.query);
      const { search, categorySlug } = req.query;

      const { total, data } = await ProductsService.listPublic({
        search,
        categorySlug,
        skip,
        take,
      });

      res.json({ data, meta: buildMeta({ page, pageSize, total }) });
    } catch (e) {
      next(e);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.validated.params;
      const data = await ProductsService.getBySlug(slug);
      res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const created = await ProductsService.create(req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.validated.params;
      const updated = await ProductsService.update(id, req.validated.body);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async addImage(req, res, next) {
    try {
      const { productId } = req.validated.params;
      const created = await ProductsService.addImage(productId, req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async addOptionGroup(req, res, next) {
    try {
      const { productId } = req.validated.params;
      const created = await ProductsService.addOptionGroup(productId, req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async addOption(req, res, next) {
    try {
      const { groupId } = req.validated.params;
      const created = await ProductsService.addOption(groupId, req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async updateStock(req, res, next) {
    try {
      const { productId } = req.validated.params;
      const { quantity } = req.validated.body;
      const updated = await ProductsService.updateStock(productId, quantity);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
};
