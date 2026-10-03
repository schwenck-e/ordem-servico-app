import { PrismaClient } from '@prisma/client';
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from './product.schemas';

// ─── Domain Error Helper ────────────────────────────────────────────────────

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function createProduct(
  prisma: PrismaClient,
  data: CreateProductInput,
  userId: string = 'SYSTEM'
) {
  const existing = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existing) {
    throw createHttpError(409, 'Já existe um produto cadastrado com o SKU informado.');
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        unit: data.unit,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        currentStock: data.initialStock,
        minStock: data.minStock,
      },
    });

    if (data.initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: data.initialStock,
          unitPrice: data.costPrice,
          reason: 'Saldo inicial cadastrado',
          createdBy: userId,
        },
      });
    }

    return product;
  });
}

export async function listProducts(
  prisma: PrismaClient,
  { page, limit, search }: ListProductsQuery
) {
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
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

export async function getLowStockProducts(prisma: PrismaClient) {
  const products = await prisma.product.findMany({
    orderBy: [
      { currentStock: 'asc' },
      { name: 'asc' },
    ],
  });

  return products.filter((p) => p.currentStock <= p.minStock);
}

export async function getProductById(prisma: PrismaClient, id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      movements: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          orderItems: true,
          movements: true,
        },
      },
    },
  });

  if (!product) {
    throw createHttpError(404, 'Produto não encontrado.');
  }

  return product;
}

export async function updateProduct(
  prisma: PrismaClient,
  id: string,
  data: UpdateProductInput
) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw createHttpError(404, 'Produto não encontrado.');
  }

  if (data.sku && data.sku !== product.sku) {
    const duplicate = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (duplicate && duplicate.id !== id) {
      throw createHttpError(409, 'Já existe um produto cadastrado com o SKU informado.');
    }
  }

  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct(prisma: PrismaClient, id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw createHttpError(404, 'Produto não encontrado.');
  }

  const [movementCount, orderItemCount] = await Promise.all([
    prisma.stockMovement.count({ where: { productId: id } }),
    prisma.workOrderItem.count({ where: { productId: id } }),
  ]);

  if (movementCount > 0 || orderItemCount > 0) {
    throw createHttpError(
      409,
      'Não é possível excluir o produto pois existem movimentações de estoque ou ordens de serviço associadas a ele.'
    );
  }

  await prisma.product.delete({ where: { id } });
}
