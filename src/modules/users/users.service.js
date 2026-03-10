import bcrypt from 'bcrypt';
import { prisma } from '../../db/prisma.js';

function notFound(msg = 'User not found') {
  const err = new Error(msg);
  err.status = 404;
  err.name = 'NotFound';
  return err;
}

function normalizeNullable(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export const UsersService = {
  async list({ q, role, isActive, skip = 0, take = 20 }) {
    const where = {
      role: {
        in: role ? [role] : ['ADMIN', 'EMPLOYEE'],
      },
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { document: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          employeeProfile: true,
        },
        skip,
        take,
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return { total, data };
  },

  async getById(id) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        role: { in: ['ADMIN', 'EMPLOYEE'] },
      },
      include: {
        employeeProfile: true,
      },
    });

    if (!user) throw notFound();
    return user;
  },

  async create(data) {
    const email = normalizeNullable(data.email);
    const phone = normalizeNullable(data.phone);
    const document = normalizeNullable(data.document);
    const passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email,
        password: passwordHash,
        role: data.role,
        isActive: data.isActive ?? true,
        isErpOnly: true,
        phone,
        document,
        employeeProfile: {
          create: {
            role:
              data.employeeProfile?.role ??
              (data.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'),
            active: data.employeeProfile?.active ?? true,
            department: normalizeNullable(data.employeeProfile?.department),
            unit: normalizeNullable(data.employeeProfile?.unit),
            code: normalizeNullable(data.employeeProfile?.code),
          },
        },
      },
      include: {
        employeeProfile: true,
      },
    });
  },

  async update(id, data) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: { in: ['ADMIN', 'EMPLOYEE'] },
      },
      include: {
        employeeProfile: true,
      },
    });

    if (!existing) throw notFound();

    const userPatch = {};

    if (data.name !== undefined) userPatch.name = data.name;
    if (data.email !== undefined) userPatch.email = normalizeNullable(data.email);
    if (data.role !== undefined) userPatch.role = data.role;
    if (data.isActive !== undefined) userPatch.isActive = data.isActive;
    if (data.phone !== undefined) userPatch.phone = normalizeNullable(data.phone);
    if (data.document !== undefined) userPatch.document = normalizeNullable(data.document);

    if (data.password) {
      userPatch.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.$transaction(async (tx) => {
      if (Object.keys(userPatch).length > 0) {
        await tx.user.update({
          where: { id },
          data: userPatch,
        });
      }

      if (data.employeeProfile) {
        const ep = {};

        if (data.employeeProfile.role !== undefined) ep.role = data.employeeProfile.role;
        if (data.employeeProfile.active !== undefined) ep.active = data.employeeProfile.active;
        if (data.employeeProfile.department !== undefined)
          ep.department = normalizeNullable(data.employeeProfile.department);
        if (data.employeeProfile.unit !== undefined)
          ep.unit = normalizeNullable(data.employeeProfile.unit);
        if (data.employeeProfile.code !== undefined)
          ep.code = normalizeNullable(data.employeeProfile.code);

        await tx.employeeProfile.upsert({
          where: { userId: id },
          update: ep,
          create: {
            userId: id,
            role:
              data.employeeProfile.role ??
              (data.role === 'ADMIN' || existing.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'),
            active: data.employeeProfile.active ?? true,
            department: normalizeNullable(data.employeeProfile.department),
            unit: normalizeNullable(data.employeeProfile.unit),
            code: normalizeNullable(data.employeeProfile.code),
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: { employeeProfile: true },
      });
    });
  },

  async setActive(id, isActive) {
    const existing = await prisma.user.findFirst({
      where: { id, role: { in: ['ADMIN', 'EMPLOYEE'] } },
    });

    if (!existing) throw notFound();

    return prisma.user.update({
      where: { id },
      data: { isActive },
      include: { employeeProfile: true },
    });
  },
};