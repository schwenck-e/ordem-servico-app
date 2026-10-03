import { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateStockMovementInput,
  ListStockMovementsQuery,
} from './stock.schemas';

// ─── Domain Error Helper ────────────────────────────────────────────────────

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function createStockMovement(
  prisma: PrismaClient,
  data: CreateStockMovementInput,
  userId: string = 'SYSTEM'
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw createHttpError(404, 'Produto não encontrado.');
    }

    let newStock = product.currentStock;

    if (data.type === 'OUT') {
      if (product.currentStock < data.quantity) {
        throw createHttpError(
          400,
          `Estoque insuficiente. Saldo disponível: ${product.currentStock}, Solicitado: ${data.quantity}.`
        );
      }
      newStock = product.currentStock - data.quantity;
    } else if (data.type === 'IN') {
      newStock = product.currentStock + data.quantity;
    } else if (data.type === 'ADJUSTMENT') {
      newStock = data.quantity;
    }

    await tx.product.update({
      where: { id: data.productId },
      data: { currentStock: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        unitPrice: data.unitPrice ?? product.costPrice,
        reason: data.reason,
        createdBy: userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            currentStock: true,
          },
        },
      },
    });

    return movement;
  });
}

export async function listStockMovements(
  prisma: PrismaClient,
  { page, limit, productId, type, workOrderId, startDate, endDate }: ListStockMovementsQuery
) {
  const where: Prisma.StockMovementWhereInput = {};

  if (productId) {
    where.productId = productId;
  }

  if (type) {
    where.type = type;
  }

  if (workOrderId) {
    where.workOrderId = workOrderId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      const adjustedEndDate = new Date(endDate);
      if (
        adjustedEndDate.getUTCHours() === 0 &&
        adjustedEndDate.getUTCMinutes() === 0 &&
        adjustedEndDate.getUTCSeconds() === 0
      ) {
        adjustedEndDate.setUTCHours(23, 59, 59, 999);
      }
      where.createdAt.lte = adjustedEndDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    }),
    prisma.stockMovement.count({ where }),
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
