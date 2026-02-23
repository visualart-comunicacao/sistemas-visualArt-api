import { prisma } from '../../db/prisma.js';

export const AuthRepository = {
  getUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  createUser(data) {
    return prisma.user.create({ data });
  },

  getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        document: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
