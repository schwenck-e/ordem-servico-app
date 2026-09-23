import { PrismaClient } from '@prisma/client';
import type { CreateCustomerInput, UpdateCustomerInput, ListCustomersQuery } from './customer.schemas';

// ─── Domain Error Helper ────────────────────────────────────────────────────

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function listCustomers(
  prisma: PrismaClient,
  { page, limit, search }: ListCustomersQuery
) {
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { document: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(prisma: PrismaClient, id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { _count: { select: { workOrders: true } } },
  });

  if (!customer) {
    throw createHttpError(404, 'Cliente não encontrado.');
  }

  return customer;
}

export async function createCustomer(
  prisma: PrismaClient,
  data: CreateCustomerInput
) {
  const existing = await prisma.customer.findUnique({
    where: { document: data.document },
  });

  if (existing) {
    throw createHttpError(409, 'Já existe um cliente cadastrado com este documento.');
  }

  return prisma.customer.create({ data });
}

export async function updateCustomer(
  prisma: PrismaClient,
  id: string,
  data: UpdateCustomerInput
) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw createHttpError(404, 'Cliente não encontrado.');
  }

  if (data.document) {
    const duplicate = await prisma.customer.findUnique({
      where: { document: data.document },
    });

    if (duplicate && duplicate.id !== id) {
      throw createHttpError(409, 'Já existe um cliente cadastrado com este documento.');
    }
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function deleteCustomer(prisma: PrismaClient, id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw createHttpError(404, 'Cliente não encontrado.');
  }

  const workOrderCount = await prisma.workOrder.count({
    where: { customerId: id },
  });

  if (workOrderCount > 0) {
    throw createHttpError(
      409,
      'Não é possível excluir o cliente pois existem ordens de serviço associadas a ele.'
    );
  }

  await prisma.customer.delete({ where: { id } });
}
