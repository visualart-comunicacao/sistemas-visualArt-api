import { OrdersService } from './orders.service.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { prisma } from '../../db/prisma.js';

export const OrdersController = {
  async create(req, res, next) {
    try {
      const userId = req.auth.sub;
      const created = await OrdersService.createSale({ userId, items: req.validated.body.items });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },

  async listMine(req, res, next) {
    try {
      const userId = req.auth.sub;
      const { page, pageSize, skip, take } = getPagination(req.query);

      const [total, data] = await prisma.$transaction([
        prisma.order.count({ where: { userId } }),
        prisma.order.findMany({
          where: { userId },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        }),
      ]);

      res.json({ data, meta: buildMeta({ page, pageSize, total }) });
    } catch (e) {
      next(e);
    }
  },
};