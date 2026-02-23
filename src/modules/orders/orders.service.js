import { prisma } from '../../db/prisma.js';
import { OrdersRepository } from './orders.repository.js';
import { calculateItemPrice } from './price-calculator.js';
import { nextOrderCode } from '../../services/order-code.service.js';

function badRequest(msg) {
  const err = new Error(msg);
  err.status = 400;
  err.name = 'BadRequest';
  return err;
}

function notFound(msg) {
  const err = new Error(msg);
  err.status = 404;
  err.name = 'NotFound';
  return err;
}

export const OrdersService = {
  async createSale({ userId, items }) {
    return prisma.$transaction(async (tx) => {
      const productIds = [...new Set(items.map((i) => i.productId))];
      const products = await OrdersRepository.getProductsForCheckoutTx(tx, productIds);
      const byId = new Map(products.map((p) => [p.id, p]));

      const orderItemsCreate = [];
      let subtotalCents = 0;

      // valida e monta itens
      for (const item of items) {
        const product = byId.get(item.productId);
        if (!product) throw notFound(`Product not found: ${item.productId}`);
        if (!product.active) throw badRequest(`Product inactive: ${product.name}`);

        // opções válidas
        const allOptions = product.optionGroups.flatMap((g) => g.options);
        const optionById = new Map(allOptions.map((o) => [o.id, o]));
        const selectedOptions = (item.optionIds ?? []).map((id) => optionById.get(id)).filter(Boolean);

        // valida seleção de grupos (required/min/max)
        for (const group of product.optionGroups) {
          const selectedInGroup = selectedOptions.filter((o) => o.groupId === group.id);
          const minRequired = group.required ? Math.max(1, group.minSelect) : group.minSelect;

          if (selectedInGroup.length < minRequired) {
            throw badRequest(`Missing option(s) for group: ${group.name}`);
          }
          if (selectedInGroup.length > group.maxSelect) {
            throw badRequest(`maxSelect exceeded for group: ${group.name}`);
          }
        }

        // estoque: bloquear e decrementar (se tiver Stock)
        if (product.stock) {
          if (product.stock.quantity < item.quantity) {
            throw badRequest(`Insufficient stock for product: ${product.name}`);
          }

          // decrementa
          await tx.stock.update({
            where: { productId: product.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        const price = calculateItemPrice({
          product,
          selectedOptions,
          width: item.width ?? null,
          height: item.height ?? null,
          quantity: item.quantity,
        });

        subtotalCents += price.lineTotalCents;

        orderItemsCreate.push({
          productId: product.id,
          name: product.name,
          priceCents: price.unitPriceCents,
          quantity: item.quantity,
          width: item.width ?? null,
          height: item.height ?? null,
          optionIds: item.optionIds ?? [],
        });
      }

      // totals ERP
      const discountCents = 0;
      const shippingCents = 0;
      const taxCents = 0;
      const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents + taxCents);

      const code = await nextOrderCode(tx, 'PED');

      const orderData = {
        code,
        type: 'SALE',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        subtotalCents,
        discountCents,
        shippingCents,
        taxCents,
        totalCents,
      };

      return OrdersRepository.createOrderWithItemsTx(tx, {
        userId,
        orderData,
        items: orderItemsCreate,
      });
    });
  },
};
