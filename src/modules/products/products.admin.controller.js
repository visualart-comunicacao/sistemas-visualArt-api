import { ProductsAdminService } from './products.admin.service.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

export const ProductsAdminController = {
  async list(req, res, next) {
    try {
      const { page, pageSize, skip, take } = getPagination(req.query);

      const { total, data } = await ProductsAdminService.list({
        search: req.query.search,
        categoryId: req.query.categoryId,
        active: req.query.active,
        pricingModel: req.query.pricingModel,
        hasStock: req.query.hasStock,
        skip,
        take,
      });

      res.json({ data, meta: buildMeta({ page, pageSize, total }) });
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await ProductsAdminService.getById(req.validated.params.id);
      res.json(product);
    } catch (e) {
      next(e);
    }
  },
};
