import { prisma } from '../../db/prisma.js';
import { calculateItemPrice } from '../orders/price-calculator.js';
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
function conflict(msg) {
  const err = new Error(msg);
  err.status = 409;
  err.name = 'Conflict';
  return err;
}

export const QuotesService = {
  // ✅ MANTÉM seu createQuote(payload) como está (o seu já calcula preço e cria itens)

  async listQuotes({ skip, take, search }) {
    const where = {
      type: 'QUOTE',
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          saleFromQuote: {
            select: { id: true, code: true, status: true, paymentStatus: true, createdAt: true },
          },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    return { total, data };
  },

  async getQuoteById(quoteId) {
    const quote = await prisma.order.findFirst({
      where: { id: quoteId, type: 'QUOTE' },
      include: {
        items: true,
        saleFromQuote: {
          select: {
            id: true,
            code: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            workOrder: { select: { id: true, code: true, status: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true, document: true } },
      },
    });
    if (!quote) throw notFound('Quote not found');
    return quote;
  },

  async approveQuote(quoteId, payload = {}) {
    const { approved = true, notes, internalNotes } = payload;

    return prisma.$transaction(async (tx) => {
      const quote = await tx.order.findFirst({
        where: { id: quoteId, type: 'QUOTE' },
        select: { id: true, approvedAt: true, canceledAt: true },
      });
      if (!quote) throw notFound('Quote not found');

      if (quote.canceledAt) throw conflict('Quote is canceled');

      const existingSale = await tx.order.findFirst({
        where: { sourceQuoteId: quoteId, type: 'SALE' },
        select: { id: true, code: true },
      });
      if (existingSale) throw conflict(`Quote already converted (${existingSale.code})`);

      const data = {
        approvedAt: approved ? new Date() : null,
      };
      if (typeof notes === 'string') data.notes = notes;
      if (typeof internalNotes === 'string') data.internalNotes = internalNotes;

      return tx.order.update({
        where: { id: quoteId },
        data,
        include: {
          items: true,
          saleFromQuote: { select: { id: true, code: true } },
          user: { select: { id: true, name: true, phone: true } },
        },
      });
    });
  },

  async cancelQuote(quoteId, payload = {}) {
    const { reason, internalNotes } = payload;

    return prisma.$transaction(async (tx) => {
      const quote = await tx.order.findFirst({
        where: { id: quoteId, type: 'QUOTE' },
        select: { id: true, canceledAt: true },
      });
      if (!quote) throw notFound('Quote not found');
      if (quote.canceledAt)
        return tx.order.findUnique({ where: { id: quoteId }, include: { items: true } });

      const existingSale = await tx.order.findFirst({
        where: { sourceQuoteId: quoteId, type: 'SALE' },
        select: { id: true, code: true },
      });
      if (existingSale) throw conflict(`Quote already converted (${existingSale.code})`);

      const note = [
        internalNotes ? String(internalNotes) : null,
        reason ? `Motivo: ${String(reason)}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      return tx.order.update({
        where: { id: quoteId },
        data: {
          canceledAt: new Date(),
          status: 'CANCELED', // opcional, mas útil
          internalNotes: note ? note : undefined,
        },
        include: {
          items: true,
          saleFromQuote: { select: { id: true, code: true } },
          user: { select: { id: true, name: true, phone: true } },
        },
      });
    });
  },

  async convertToSale(quoteId, opts = {}) {
    const {
      saleStatus = 'PENDING',
      requireApproved = true,
      force = false,
      createWorkOrder = true,
      workOrder = {},
    } = opts;

    return prisma.$transaction(async (tx) => {
      const quote = await tx.order.findFirst({
        where: { id: quoteId, type: 'QUOTE' },
        include: { items: true },
      });
      if (!quote) throw notFound('Quote not found');

      if (quote.canceledAt) throw conflict('Quote is canceled');

      if (requireApproved && !force && !quote.approvedAt) {
        throw badRequest('Quote must be approved before converting to sale');
      }

      // idempotência
      const existingSale = await tx.order.findFirst({
        where: { sourceQuoteId: quoteId, type: 'SALE' },
        include: { items: true, workOrder: { include: { items: true } } },
      });
      if (existingSale) return existingSale;

      const saleCode = await nextOrderCode(tx, 'PED');

      const sale = await tx.order.create({
        data: {
          userId: quote.userId,
          code: saleCode,
          type: 'SALE',
          status: saleStatus,
          paymentStatus: 'UNPAID',

          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          shippingCents: quote.shippingCents,
          taxCents: quote.taxCents,
          totalCents: quote.totalCents,

          notes: quote.notes,
          internalNotes: quote.internalNotes,

          sourceQuoteId: quote.id,

          items: {
            create: quote.items.map((it) => ({
              productId: it.productId,
              name: it.name,
              priceCents: it.priceCents,
              quantity: it.quantity,
              width: it.width,
              height: it.height,
              optionIds: it.optionIds,
            })),
          },
        },
        include: { items: true },
      });

      if (createWorkOrder) {
        const woCode = await nextOrderCode(tx, 'OS');

        await tx.workOrder.create({
          data: {
            code: woCode,
            orderId: sale.id,
            status: 'OPEN',
            dueAt: workOrder.dueAt ?? null,
            priority: workOrder.priority ?? 0,
            instructions: workOrder.instructions ?? null,
            internalNotes: workOrder.internalNotes ?? null,
            items: {
              create: sale.items.map((orderItem) => ({
                orderItemId: orderItem.id,
                status: 'OPEN',
                notes: null,
              })),
            },
          },
        });
      }

      return tx.order.findUnique({
        where: { id: sale.id },
        include: { items: true, workOrder: { include: { items: true } } },
      });
    });
  },

  async updateQuote(quoteId, payload = {}) {
    return prisma.$transaction(async (tx) => {
      const quote = await tx.order.findFirst({
        where: { id: quoteId, type: 'QUOTE' },
        include: { items: true },
      });
      if (!quote) throw notFound('Quote not found');

      // trava edição se já aprovado/cancelado/convertido
      if (quote.canceledAt) throw conflict('Quote is canceled');
      if (quote.approvedAt) throw conflict('Quote is approved and cannot be edited');

      const existingSale = await tx.order.findFirst({
        where: { sourceQuoteId: quoteId, type: 'SALE' },
        select: { id: true, code: true },
      });
      if (existingSale) throw conflict(`Quote already converted (${existingSale.code})`);

      // se veio items, recalcula e substitui snapshot
      let nextSubtotalCents = quote.subtotalCents;
      let nextItemsCreate = null;

      if (payload.items) {
        const productIds = [...new Set(payload.items.map((i) => i.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          include: { optionGroups: { include: { options: true } } },
        });
        const byId = new Map(products.map((p) => [p.id, p]));

        nextSubtotalCents = 0;
        nextItemsCreate = [];

        for (const item of payload.items) {
          const product = byId.get(item.productId);
          if (!product) throw notFound(`Product not found: ${item.productId}`);
          if (!product.active) throw badRequest(`Product inactive: ${product.name}`);

          const allOptions = product.optionGroups.flatMap((g) => g.options);
          const optionById = new Map(allOptions.map((o) => [o.id, o]));
          const selectedOptions = (item.optionIds ?? [])
            .map((id) => optionById.get(id))
            .filter(Boolean);

          // valida required/min/max
          for (const group of product.optionGroups) {
            const selectedInGroup = selectedOptions.filter((o) => o.groupId === group.id);
            const minRequired = group.required ? Math.max(1, group.minSelect) : group.minSelect;
            if (selectedInGroup.length < minRequired)
              throw badRequest(`Missing option(s) for group: ${group.name}`);
            if (selectedInGroup.length > group.maxSelect)
              throw badRequest(`maxSelect exceeded for group: ${group.name}`);
          }

          const price = calculateItemPrice({
            product,
            selectedOptions,
            width: item.width ?? null,
            height: item.height ?? null,
            quantity: item.quantity,
          });

          nextSubtotalCents += price.lineTotalCents;

          nextItemsCreate.push({
            productId: product.id,
            name: product.name,
            priceCents: price.unitPriceCents,
            quantity: item.quantity,
            width: item.width ?? null,
            height: item.height ?? null,
            optionIds: item.optionIds ?? [],
          });
        }
      }

      const discountCents = payload.discountCents ?? quote.discountCents;
      const shippingCents = payload.shippingCents ?? quote.shippingCents;
      const taxCents = payload.taxCents ?? quote.taxCents;
      const totalCents = Math.max(0, nextSubtotalCents - discountCents + shippingCents + taxCents);

      // atualiza cabeçalho
      await tx.order.update({
        where: { id: quoteId },
        data: {
          userId: payload.customerUserId ?? quote.userId,
          subtotalCents: nextSubtotalCents,
          discountCents,
          shippingCents,
          taxCents,
          totalCents,
          notes: payload.notes === undefined ? quote.notes : payload.notes,
          internalNotes:
            payload.internalNotes === undefined ? quote.internalNotes : payload.internalNotes,
        },
      });

      // substitui itens se vieram
      if (nextItemsCreate) {
        await tx.orderItem.deleteMany({ where: { orderId: quoteId } });
        await tx.orderItem.createMany({
          data: nextItemsCreate.map((it) => ({ ...it, orderId: quoteId })),
        });
      }

      return tx.order.findUnique({
        where: { id: quoteId },
        include: {
          items: true,
          saleFromQuote: { select: { id: true, code: true } },
          user: { select: { id: true, name: true, phone: true, email: true, document: true } },
        },
      });
    });
  },
};
