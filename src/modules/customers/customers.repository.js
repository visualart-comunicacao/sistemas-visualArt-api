import { prisma } from '../../db/prisma.js';

export const CustomersRepository = {
  getUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  getProfileByCpf(cpf) {
    return prisma.customerProfile.findUnique({ where: { cpf } });
  },

  getProfileByCnpj(cnpj) {
    return prisma.customerProfile.findUnique({ where: { cnpj } });
  },

  createFullCustomer({ user, profile, addresses }) {
    return prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({ data: user });

      const createdProfile = await tx.customerProfile.create({
        data: { ...profile, userId: createdUser.id },
      });

      const createdAddresses = await tx.address.createMany({
        data: addresses.map((a) => ({ ...a, userId: createdUser.id })),
      });

      return { createdUser, createdProfile, createdAddresses };
    });
  },

  getMe(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        addresses: { orderBy: { createdAt: 'desc' } },
      },
    });
  },

  updateProfile(userId, data) {
    return prisma.customerProfile.update({
      where: { userId },
      data,
    });
  },

  createAddress(userId, data) {
    return prisma.address.create({ data: { ...data, userId } });
  },

  updateAddress(userId, id, data) {
    return prisma.address.update({
      where: { id },
      data,
    }).then((addr) => {
      if (addr.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403, name: 'Forbidden' });
      return addr;
    });
  },

  async deleteAddress(userId, id) {
    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr) return null;
    if (addr.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403, name: 'Forbidden' });

    return prisma.address.delete({ where: { id } });
  },

  async setDefaultAddress(userId, addressId, type) {
    return prisma.$transaction(async (tx) => {
      const addr = await tx.address.findUnique({ where: { id: addressId } });
      if (!addr) return null;
      if (addr.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403, name: 'Forbidden' });

      await tx.address.updateMany({
        where: { userId, type },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true, type },
      });
    });
  },
};
