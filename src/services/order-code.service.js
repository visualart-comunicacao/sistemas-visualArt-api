import { prisma } from '../db/prisma.js';

function pad6(n) {
  return String(n).padStart(6, '0');
}

/**
 * Gera o próximo código sequencial por (key, year), dentro de transação.
 * key: "ORC" (orçamento) ou "PED" (pedido/venda)
 */
export async function nextOrderCode(tx, key) {
  const year = new Date().getFullYear();

  // Upsert para garantir que exista a linha do contador
  const seq = await tx.sequence.upsert({
    where: { key_year: { key, year } },
    update: { value: { increment: 1 } },
    create: { key, year, value: 1 },
  });

  return `${key}-${year}-${pad6(seq.value)}`;
}
