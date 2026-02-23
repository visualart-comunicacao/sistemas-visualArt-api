import { prisma } from '../../db/prisma.js';

export const OrdersRepository = {
  createOrderWithItemsTx(tx, { userId, orderData, items }) {
    return tx.order.create({
      data: {
        userId,
        ...orderData,
        items: { create: items },
      },
      include: { items: true },
    });
  },

  getProductsForCheckoutTx(tx, productIds) {
    return tx.product.findMany({
      where: { id: { in: productIds } },
      include: {
        optionGroups: { include: { options: true } },
        stock: true,
      },
    });
  },
};
