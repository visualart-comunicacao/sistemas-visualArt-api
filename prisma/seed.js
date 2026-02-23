import bcrypt from 'bcrypt';
import { prisma } from '../src/db/prisma.js';

async function upsertAdmin() {
  const email = 'admin@visualart.com';
  const password = 'Admin@123';

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return;

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: 'Admin Visual Art',
      email,
      password: hash,
      role: 'ADMIN',
    },
  });
}

async function upsertCategories() {
  const categories = [
    { name: 'Banners e Lonas', slug: 'banners-e-lonas' },
    { name: 'Adesivos', slug: 'adesivos' },
    { name: 'Placas e Sinalização', slug: 'placas-e-sinalizacao' },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }

  return prisma.category.findMany();
}

async function createOrUpdateProductBanner(categoryId) {
  const slug = 'banner-lona-vinil-personalizado';

  const product = await prisma.product.upsert({
    where: { slug },
    update: {
      name: 'Banner em Lona Vinil (Personalizado)',
      description:
        'Banner em lona vinil com impressão de alta qualidade. Configure tamanho, acabamento e extras.',
      active: true,
      categoryId,
      pricingModel: 'AREA_M2',
      dimensionUnit: 'CM',
      minWidth: 20,
      maxWidth: 500,
      minHeight: 20,
      maxHeight: 300,
      step: 1,
      minAreaM2: 0.25,
      minPriceCents: 3500,
      baseM2PriceCents: 6500,
    },
    create: {
      name: 'Banner em Lona Vinil (Personalizado)',
      slug,
      description:
        'Banner em lona vinil com impressão de alta qualidade. Configure tamanho, acabamento e extras.',
      active: true,
      categoryId,
      pricingModel: 'AREA_M2',
      dimensionUnit: 'CM',
      minWidth: 20,
      maxWidth: 500,
      minHeight: 20,
      maxHeight: 300,
      step: 1,
      minAreaM2: 0.25,
      minPriceCents: 3500,
      baseM2PriceCents: 6500,
    },
  });

  // imagens (URLs placeholders — troque depois)
  await prisma.productImage.createMany({
    data: [
      {
        productId: product.id,
        url: 'https://via.placeholder.com/1200x800.png?text=Banner+Lona+1',
        alt: 'Banner em lona - exemplo 1',
      },
      {
        productId: product.id,
        url: 'https://via.placeholder.com/1200x800.png?text=Banner+Lona+2',
        alt: 'Banner em lona - exemplo 2',
      },
    ],
    skipDuplicates: true,
  });

  // estoque (para e-commerce, você pode usar “estoque infinito” depois, mas deixei 999)
  await prisma.stock.upsert({
    where: { productId: product.id },
    update: { quantity: 999 },
    create: { productId: product.id, quantity: 999 },
  });

  // Option Groups + Options
  const materialGroup = await prisma.productOptionGroup.upsert({
    where: { id: 'tmp' }, // truque: como não temos unique composto, vamos criar sempre novo e limpar antes
    update: {},
    create: {
      productId: product.id,
      name: 'Material',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
    },
  });

  const acabamentoGroup = await prisma.productOptionGroup.upsert({
    where: { id: 'tmp2' },
    update: {},
    create: {
      productId: product.id,
      name: 'Acabamento',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 2,
    },
  });

  const extrasGroup = await prisma.productOptionGroup.upsert({
    where: { id: 'tmp3' },
    update: {},
    create: {
      productId: product.id,
      name: 'Extras',
      required: false,
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 3,
    },
  });

  // Limpa opções antigas desses groups (se rodar seed mais de uma vez)
  await prisma.productOption.deleteMany({ where: { groupId: materialGroup.id } });
  await prisma.productOption.deleteMany({ where: { groupId: acabamentoGroup.id } });
  await prisma.productOption.deleteMany({ where: { groupId: extrasGroup.id } });

  await prisma.productOption.createMany({
    data: [
      // Material (PER_M2_CENTS)
      {
        groupId: materialGroup.id,
        name: 'Lona 440g',
        modifierType: 'PER_M2_CENTS',
        modifierValue: 0, // já está no baseM2PriceCents
        sortOrder: 1,
      },
      {
        groupId: materialGroup.id,
        name: 'Lona 280g (mais leve)',
        modifierType: 'PER_M2_CENTS',
        modifierValue: -800, // -R$8/m² (desconto)
        sortOrder: 2,
      },

      // Acabamento (FIXED_CENTS)
      {
        groupId: acabamentoGroup.id,
        name: 'Com bastão e corda',
        modifierType: 'FIXED_CENTS',
        modifierValue: 1500,
        sortOrder: 1,
      },
      {
        groupId: acabamentoGroup.id,
        name: 'Dobrado (sem bastão)',
        modifierType: 'FIXED_CENTS',
        modifierValue: 0,
        sortOrder: 2,
      },

      // Extras
      {
        groupId: extrasGroup.id,
        name: 'Ilhós a cada 50cm',
        modifierType: 'FIXED_CENTS',
        modifierValue: 1200,
        sortOrder: 1,
      },
      {
        groupId: extrasGroup.id,
        name: 'Reforço nas bordas',
        modifierType: 'FIXED_CENTS',
        modifierValue: 900,
        sortOrder: 2,
      },
      {
        groupId: extrasGroup.id,
        name: 'Arte/Design (criação)',
        modifierType: 'FIXED_CENTS',
        modifierValue: 5000,
        sortOrder: 3,
      },
    ],
  });

  return product;
}

async function createOrUpdateProductAdesivo(categoryId) {
  const slug = 'adesivo-vinil-recorte-e-impressao';

  const product = await prisma.product.upsert({
    where: { slug },
    update: {
      name: 'Adesivo Vinil (Personalizado)',
      description:
        'Adesivo em vinil com impressão. Configure tamanho e acabamento. Ideal para vitrines, carros e objetos.',
      active: true,
      categoryId,
      pricingModel: 'AREA_M2',
      dimensionUnit: 'CM',
      minWidth: 5,
      maxWidth: 150,
      minHeight: 5,
      maxHeight: 150,
      step: 1,
      minAreaM2: 0.10,
      minPriceCents: 2500,
      baseM2PriceCents: 9000,
    },
    create: {
      name: 'Adesivo Vinil (Personalizado)',
      slug,
      description:
        'Adesivo em vinil com impressão. Configure tamanho e acabamento. Ideal para vitrines, carros e objetos.',
      active: true,
      categoryId,
      pricingModel: 'AREA_M2',
      dimensionUnit: 'CM',
      minWidth: 5,
      maxWidth: 150,
      minHeight: 5,
      maxHeight: 150,
      step: 1,
      minAreaM2: 0.10,
      minPriceCents: 2500,
      baseM2PriceCents: 9000,
    },
  });

  await prisma.productImage.createMany({
    data: [
      {
        productId: product.id,
        url: 'https://via.placeholder.com/1200x800.png?text=Adesivo+1',
        alt: 'Adesivo vinil - exemplo 1',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.stock.upsert({
    where: { productId: product.id },
    update: { quantity: 999 },
    create: { productId: product.id, quantity: 999 },
  });

  const acabamentoGroup = await prisma.productOptionGroup.upsert({
    where: { id: 'tmp4' },
    update: {},
    create: {
      productId: product.id,
      name: 'Acabamento',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
    },
  });

  const aplicacaoGroup = await prisma.productOptionGroup.upsert({
    where: { id: 'tmp5' },
    update: {},
    create: {
      productId: product.id,
      name: 'Aplicação',
      required: false,
      minSelect: 0,
      maxSelect: 1,
      sortOrder: 2,
    },
  });

  await prisma.productOption.deleteMany({ where: { groupId: acabamentoGroup.id } });
  await prisma.productOption.deleteMany({ where: { groupId: aplicacaoGroup.id } });

  await prisma.productOption.createMany({
    data: [
      {
        groupId: acabamentoGroup.id,
        name: 'Laminação Fosca',
        modifierType: 'PER_M2_CENTS',
        modifierValue: 2500, // +R$25/m²
        sortOrder: 1,
      },
      {
        groupId: acabamentoGroup.id,
        name: 'Laminação Brilho',
        modifierType: 'PER_M2_CENTS',
        modifierValue: 2200, // +R$22/m²
        sortOrder: 2,
      },
      {
        groupId: acabamentoGroup.id,
        name: 'Sem laminação',
        modifierType: 'PER_M2_CENTS',
        modifierValue: 0,
        sortOrder: 3,
      },

      {
        groupId: aplicacaoGroup.id,
        name: 'Com aplicação (mão de obra)',
        modifierType: 'FIXED_CENTS',
        modifierValue: 8000,
        sortOrder: 1,
      },
    ],
  });

  return product;
}

async function main() {
  // Importante: apaga groups "tmp*" antigos, porque usamos upsert por id fake
  // (Como não temos unique composto, usamos ids temporários só para garantir execução)
  await prisma.productOption.deleteMany({
    where: {
      OR: [
        { groupId: 'tmp' },
        { groupId: 'tmp2' },
        { groupId: 'tmp3' },
        { groupId: 'tmp4' },
        { groupId: 'tmp5' },
      ],
    },
  });
  await prisma.productOptionGroup.deleteMany({
    where: {
      id: { in: ['tmp', 'tmp2', 'tmp3', 'tmp4', 'tmp5'] },
    },
  });

  await upsertAdmin();

  const cats = await upsertCategories();
  const banners = cats.find((c) => c.slug === 'banners-e-lonas');
  const adesivos = cats.find((c) => c.slug === 'adesivos');

  if (banners) await createOrUpdateProductBanner(banners.id);
  if (adesivos) await createOrUpdateProductAdesivo(adesivos.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
