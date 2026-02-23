import { CustomersErpService } from './customers-erp.service.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

export const CustomersErpController = {
  async create(req, res, next) {
    try {
      const created = await CustomersErpService.create(req.validated.body);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      const { page, pageSize, skip, take } = getPagination(req.query);

      const { total, data } = await CustomersErpService.list({
        search: req.query.search,
        type: req.query.type,
        isBlocked: req.query.isBlocked,
        isActive: req.query.isActive,
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
      const data = await CustomersErpService.getById(req.validated.params.id);
      res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.validated.params;
      const updated = await CustomersErpService.update(id, req.validated.body);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async setActive(req, res, next) {
    try {
      const { id } = req.validated.params;
      const { isActive } = req.validated.body;
      const updated = await CustomersErpService.setActive(id, isActive);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async setBlocked(req, res, next) {
    try {
      const { id } = req.validated.params;
      const { isBlocked } = req.validated.body;
      const updated = await CustomersErpService.setBlocked(id, isBlocked);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.validated.params;
      const updated = await CustomersErpService.remove(id);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async restore(req, res, next) {
    try {
      const { id } = req.validated.params;
      const updated = await CustomersErpService.restore(id);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  async listOrders(req, res, next) {
    try {
      const userId = req.validated.params.id;
      const { page, pageSize, skip, take } = getPagination(req.query);

      const { total, data } = await CustomersErpService.listCustomerOrders({
        userId,
        type: req.query.type,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        from: req.query.from,
        to: req.query.to,
        skip,
        take,
      });

      res.json({ data, meta: buildMeta({ page, pageSize, total }) });
    } catch (e) {
      next(e);
    }
  },

  async summary(req, res, next) {
    try {
      const userId = req.validated.params.id;
      const data = await CustomersErpService.getCustomerSummary(userId);
      res.json(data);
    } catch (e) {
      next(e);
    }
  },
};
