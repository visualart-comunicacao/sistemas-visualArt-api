import { prisma } from '../../db/prisma.js';

function notFound(msg = 'Customer not found') {
  const err = new Error(msg);
  err.status = 404;
  err.name = 'NotFound';
  return err;
}

function parseBool(v) {
  if (v === true || v === false) return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

export const CustomersErpService = {
  async create(data) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          phone: data.phone ?? null,
          email: data.email ?? null,
          document: data.document ?? null,
          isErpOnly: true,
          isActive: data.isActive ?? true,
          password: null,
          role: 'CUSTOMER',
        },
      });

      await tx.customerProfile.create({
        data: {
          userId: user.id,
          type: data.type ?? 'PERSON',

          // PF
          fullName: data.fullName ?? null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          gender: data.gender ?? 'NOT_INFORMED',
          cpf: data.cpf ?? null,
          rg: data.rg ?? null,

          // PJ
          cnpj: data.cnpj ?? null,
          companyName: data.companyName ?? null,
          tradeName: data.tradeName ?? null,
          stateTaxId: data.stateTaxId ?? null,
          municipalTaxId: data.municipalTaxId ?? null,

          // contato
          phone2: data.phone2 ?? null,
          whatsapp: data.whatsapp ?? true,

          // LGPD
          marketingOptIn: data.marketingOptIn ?? false,

          // controle
          notes: data.notes ?? null,
          isBlocked: data.isBlocked ?? false,
        },
      });

      if (data.address) {
        const addrType = data.address.type ?? 'SHIPPING';
        const isDefault = data.address.isDefault ?? true;

        if (isDefault) {
          await tx.address.updateMany({
            where: { userId: user.id, type: addrType, isDefault: true },
            data: { isDefault: false },
          });
        }

        await tx.address.create({
          data: {
            userId: user.id,
            type: addrType,
            isDefault,
            label: data.address.label ?? null,
            recipient: data.address.recipient ?? null,
            zipCode: data.address.zipCode,
            street: data.address.street,
            number: data.address.number,
            complement: data.address.complement ?? null,
            district: data.address.district,
            city: data.address.city,
            state: data.address.state,
            reference: data.address.reference ?? null,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: { profile: true, addresses: true },
      });
    });
  },

  async list({ search, type, isBlocked, isActive, skip = 0, take = 20 }) {
    const blocked = parseBool(isBlocked);
    const active = parseBool(isActive);

    const where = {
      isErpOnly: true,
      ...(active !== undefined ? { isActive: active } : {}),
      profile: {
        ...(type ? { type } : {}),
        ...(blocked !== undefined ? { isBlocked: blocked } : {}),
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
              { document: { contains: search } },
              { profile: { cpf: { contains: search } } },
              { profile: { cnpj: { contains: search } } },
              { profile: { companyName: { contains: search, mode: 'insensitive' } } },
              { profile: { tradeName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: { profile: true, addresses: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  },

  async getById(id) {
    const user = await prisma.user.findFirst({
      where: { id, isErpOnly: true },
      include: { profile: true, addresses: true },
    });

    if (!user) throw notFound();
    return user;
  },

  async update(id, data) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id, isErpOnly: true },
        include: { profile: true },
      });
      if (!existing) throw notFound();

      // PATCH user
      const userPatch = {};
      if (data.name !== undefined) userPatch.name = data.name;
      if (data.phone !== undefined) userPatch.phone = data.phone ?? null;
      if (data.email !== undefined) userPatch.email = data.email ?? null;
      if (data.document !== undefined) userPatch.document = data.document ?? null;
      if (data.isActive !== undefined) userPatch.isActive = data.isActive;

      if (Object.keys(userPatch).length > 0) {
        await tx.user.update({ where: { id }, data: userPatch });
      }

      // PATCH profile (upsert)
      const profilePatch = {};
      if (data.type !== undefined) profilePatch.type = data.type;

      if (data.fullName !== undefined) profilePatch.fullName = data.fullName ?? null;
      if (data.birthDate !== undefined)
        profilePatch.birthDate = data.birthDate ? new Date(data.birthDate) : null;
      if (data.gender !== undefined) profilePatch.gender = data.gender ?? 'NOT_INFORMED';

      if (data.cpf !== undefined) profilePatch.cpf = data.cpf ?? null;
      if (data.rg !== undefined) profilePatch.rg = data.rg ?? null;

      if (data.cnpj !== undefined) profilePatch.cnpj = data.cnpj ?? null;
      if (data.companyName !== undefined) profilePatch.companyName = data.companyName ?? null;
      if (data.tradeName !== undefined) profilePatch.tradeName = data.tradeName ?? null;
      if (data.stateTaxId !== undefined) profilePatch.stateTaxId = data.stateTaxId ?? null;
      if (data.municipalTaxId !== undefined) profilePatch.municipalTaxId = data.municipalTaxId ?? null;

      if (data.phone2 !== undefined) profilePatch.phone2 = data.phone2 ?? null;
      if (data.whatsapp !== undefined) profilePatch.whatsapp = data.whatsapp;

      if (data.marketingOptIn !== undefined) profilePatch.marketingOptIn = data.marketingOptIn;
      if (data.notes !== undefined) profilePatch.notes = data.notes ?? null;
      if (data.isBlocked !== undefined) profilePatch.isBlocked = data.isBlocked;

      if (Object.keys(profilePatch).length > 0) {
        await tx.customerProfile.upsert({
          where: { userId: id },
          update: profilePatch,
          create: { userId: id, type: 'PERSON', ...profilePatch },
        });
      }

      // endereço: cria um novo e ajusta default
      if (data.address) {
        const addrType = data.address.type ?? 'SHIPPING';
        const isDefault = data.address.isDefault ?? true;

        if (isDefault) {
          await tx.address.updateMany({
            where: { userId: id, type: addrType, isDefault: true },
            data: { isDefault: false },
          });
        }

        await tx.address.create({
          data: {
            userId: id,
            type: addrType,
            isDefault,
            label: data.address.label ?? null,
            recipient: data.address.recipient ?? null,
            zipCode: data.address.zipCode,
            street: data.address.street,
            number: data.address.number,
            complement: data.address.complement ?? null,
            district: data.address.district,
            city: data.address.city,
            state: data.address.state,
            reference: data.address.reference ?? null,
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: { profile: true, addresses: true },
      });
    });
  },

  async setActive(id, isActive) {
    const existing = await prisma.user.findFirst({ where: { id, isErpOnly: true } });
    if (!existing) throw notFound();

    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  },

  async setBlocked(id, isBlocked) {
    const existing = await prisma.user.findFirst({ where: { id, isErpOnly: true } });
    if (!existing) throw notFound();

    await prisma.customerProfile.upsert({
      where: { userId: id },
      update: { isBlocked },
      create: { userId: id, type: 'PERSON', isBlocked },
    });

    return this.getById(id);
  },

  async remove(id) {
    // soft delete
    return this.setActive(id, false);
  },

  async restore(id) {
    return this.setActive(id, true);
  },

  async listCustomerOrders({ userId, type, status, paymentStatus, from, to, skip = 0, take = 20 }) {
    const customer = await prisma.user.findFirst({ where: { id: userId, isErpOnly: true } });
    if (!customer) throw notFound();

    const where = {
      userId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
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
        include: { items: true },
      }),
    ]);

    return { total, data };
  },

  async getCustomerSummary(userId) {
    const customer = await prisma.user.findFirst({
      where: { id: userId, isErpOnly: true },
      include: { profile: true },
    });
    if (!customer) throw notFound();

    const [
      ordersCount,
      quotesCount,
      salesCount,
      totalsByPayment,
      totalsByStatus,
      lastOrder,
      lastSale,
      lastQuote,
      sumSalesPaid,
      sumSalesTotal,
    ] = await prisma.$transaction([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, type: 'QUOTE' } }),
      prisma.order.count({ where: { userId, type: 'SALE' } }),

      prisma.order.groupBy({
        by: ['paymentStatus'],
        where: { userId },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),

      prisma.order.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),

      prisma.order.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, type: true, status: true, paymentStatus: true, totalCents: true, createdAt: true },
      }),

      prisma.order.findFirst({
        where: { userId, type: 'SALE' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, status: true, paymentStatus: true, totalCents: true, createdAt: true },
      }),

      prisma.order.findFirst({
        where: { userId, type: 'QUOTE' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, code: true, status: true, paymentStatus: true, totalCents: true, createdAt: true },
      }),

      prisma.order.aggregate({
        where: { userId, type: 'SALE', paymentStatus: 'PAID' },
        _sum: { totalCents: true },
      }),

      prisma.order.aggregate({
        where: { userId, type: 'SALE' },
        _sum: { totalCents: true },
      }),
    ]);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        document: customer.document,
        isActive: customer.isActive,
        isErpOnly: customer.isErpOnly,
        profile: customer.profile,
      },
      stats: {
        ordersCount,
        quotesCount,
        salesCount,
        sumSalesPaidCents: sumSalesPaid._sum.totalCents ?? 0,
        sumSalesTotalCents: sumSalesTotal._sum.totalCents ?? 0,
      },
      breakdown: {
        byPaymentStatus: totalsByPayment.map((x) => ({
          paymentStatus: x.paymentStatus,
          count: x._count._all,
          sumTotalCents: x._sum.totalCents ?? 0,
        })),
        byStatus: totalsByStatus.map((x) => ({
          status: x.status,
          count: x._count._all,
          sumTotalCents: x._sum.totalCents ?? 0,
        })),
      },
      last: { lastOrder, lastSale, lastQuote },
    };
  },
};
