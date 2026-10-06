import { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateQuoteInput,
  CreateQuoteItemInput,
  UpdateQuoteInput,
  UpdateQuoteStatusInput,
  ListQuotesQuery,
} from './quote.schemas';
import { generateOrderNumber } from '../work-orders/work-order.service';

// ─── Domain Error Helper ────────────────────────────────────────────────────

export function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ─── Financial Calculations ─────────────────────────────────────────────────

export function calculateQuoteTotals(items: CreateQuoteItemInput[], discount: number = 0) {
  let totalServices = 0;
  let totalParts = 0;

  const calculatedItems = items.map((item) => {
    const subtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    if (item.type === 'SERVICE') {
      totalServices = Math.round((totalServices + subtotal) * 100) / 100;
    } else {
      totalParts = Math.round((totalParts + subtotal) * 100) / 100;
    }
    return {
      ...item,
      subtotal,
    };
  });

  const grossTotal = Math.round((totalServices + totalParts) * 100) / 100;

  if (discount < 0) {
    throw createHttpError(400, 'O valor de desconto não pode ser negativo.');
  }

  if (discount > grossTotal) {
    throw createHttpError(
      400,
      `O desconto (R$ ${discount.toFixed(2)}) não pode ser superior ao valor total bruto dos itens (R$ ${grossTotal.toFixed(2)}).`
    );
  }

  const totalAmount = Math.round((grossTotal - discount) * 100) / 100;

  return {
    items: calculatedItems,
    totalServices,
    totalParts,
    discount,
    totalAmount,
  };
}

// ─── Protocol Generator ─────────────────────────────────────────────────────

export async function generateQuoteNumber(tx: Prisma.TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `ORC-${currentYear}-`;

  const lastQuote = await tx.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: 'desc' },
    select: { quoteNumber: true },
  });

  let nextSeq = 1;
  if (lastQuote) {
    const parts = lastQuote.quoteNumber.split('-');
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function createQuote(prisma: PrismaClient, data: CreateQuoteInput) {
  // 1. Validar cliente existente
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });

  if (!customer) {
    throw createHttpError(404, 'Cliente não encontrado.');
  }

  // 2. Validar técnico se informado
  if (data.technicianId) {
    const technician = await prisma.technician.findUnique({
      where: { id: data.technicianId },
    });

    if (!technician) {
      throw createHttpError(404, 'Técnico não encontrado.');
    }

    if (!technician.isActive) {
      throw createHttpError(400, 'O técnico selecionado está inativo.');
    }
  }

  // 3. Calcular totais com validação de desconto
  const { items: calculatedItems, totalServices, totalParts, discount, totalAmount } =
    calculateQuoteTotals(data.items, data.discount ?? 0);

  // 4. Executar transação atômica
  return prisma.$transaction(async (tx) => {
    const quoteNumber = await generateQuoteNumber(tx);

    const quote = await tx.quote.create({
      data: {
        quoteNumber,
        customerId: data.customerId,
        technicianId: data.technicianId ?? null,
        equipment: data.equipment,
        serialNumber: data.serialNumber ?? null,
        reportedDefect: data.reportedDefect,
        technicalDiagnosis: data.technicalDiagnosis ?? null,
        status: 'DRAFT',
        notes: data.notes ?? null,
        totalServices,
        totalParts,
        discount,
        totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        items: {
          create: calculatedItems.map((item) => ({
            productId: item.productId ?? null,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        customer: true,
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    return quote;
  });
}

export async function listQuotes(prisma: PrismaClient, query: ListQuotesQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Prisma.QuoteWhereInput = {};

  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }

  if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) {
      where.createdAt.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      where.createdAt.lte = new Date(query.endDate);
    }
  }

  if (query.search) {
    where.OR = [
      { quoteNumber: { contains: query.search } },
      { equipment: { contains: query.search } },
      { customer: { name: { contains: query.search } } },
    ];
  }

  const [total, quotes] = await Promise.all([
    prisma.quote.count({ where }),
    prisma.quote.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return {
    data: quotes,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getQuoteById(prisma: PrismaClient, id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      technician: true,
      items: {
        include: {
          product: true,
        },
      },
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          netAmount: true,
          paidAmount: true,
          dueDate: true,
        },
      },
    },
  });

  if (!quote) {
    throw createHttpError(404, 'Orçamento não encontrado.');
  }

  return quote;
}

export async function updateQuote(
  prisma: PrismaClient,
  id: string,
  data: UpdateQuoteInput
) {
  const existing = await prisma.quote.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw createHttpError(404, 'Orçamento não encontrado.');
  }

  if (existing.status !== 'DRAFT') {
    throw createHttpError(400, 'Apenas orçamentos em rascunho (DRAFT) podem ser alterados.');
  }

  if (data.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw createHttpError(404, 'Cliente não encontrado.');
    }
  }

  if (data.technicianId) {
    const technician = await prisma.technician.findUnique({
      where: { id: data.technicianId },
    });
    if (!technician) {
      throw createHttpError(404, 'Técnico não encontrado.');
    }
    if (!technician.isActive) {
      throw createHttpError(400, 'O técnico selecionado está inativo.');
    }
  }

  // Recálculo financeiro se itens ou desconto forem alterados
  let totalServices = existing.totalServices;
  let totalParts = existing.totalParts;
  let discount = data.discount !== undefined ? data.discount : existing.discount;
  let totalAmount = existing.totalAmount;
  let itemsToPersist: Array<CreateQuoteItemInput & { subtotal: number }> | null = null;

  if (data.items) {
    const calculated = calculateQuoteTotals(data.items, discount);
    totalServices = calculated.totalServices;
    totalParts = calculated.totalParts;
    discount = calculated.discount;
    totalAmount = calculated.totalAmount;
    itemsToPersist = calculated.items;
  } else if (data.discount !== undefined) {
    const existingItemsInput: CreateQuoteItemInput[] = existing.items.map((i) => ({
      productId: i.productId,
      type: i.type as 'SERVICE' | 'PART',
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const calculated = calculateQuoteTotals(existingItemsInput, discount);
    totalServices = calculated.totalServices;
    totalParts = calculated.totalParts;
    discount = calculated.discount;
    totalAmount = calculated.totalAmount;
  }

  return prisma.$transaction(async (tx) => {
    if (itemsToPersist) {
      await tx.quoteItem.deleteMany({
        where: { quoteId: id },
      });

      await tx.quoteItem.createMany({
        data: itemsToPersist.map((item) => ({
          quoteId: id,
          productId: item.productId ?? null,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });
    }

    const updated = await tx.quote.update({
      where: { id },
      data: {
        ...(data.customerId ? { customerId: data.customerId } : {}),
        ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
        ...(data.equipment ? { equipment: data.equipment } : {}),
        ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
        ...(data.reportedDefect ? { reportedDefect: data.reportedDefect } : {}),
        ...(data.technicalDiagnosis !== undefined ? { technicalDiagnosis: data.technicalDiagnosis } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.validUntil !== undefined ? { validUntil: data.validUntil ? new Date(data.validUntil) : null } : {}),
        discount,
        totalServices,
        totalParts,
        totalAmount,
      },
      include: {
        customer: true,
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    return updated;
  });
}

export async function updateQuoteStatus(
  prisma: PrismaClient,
  id: string,
  data: UpdateQuoteStatusInput
) {
  const quote = await prisma.quote.findUnique({
    where: { id },
  });

  if (!quote) {
    throw createHttpError(404, 'Orçamento não encontrado.');
  }

  if (quote.workOrderId) {
    throw createHttpError(400, 'Não é possível alterar o status de um orçamento já convertido em Ordem de Serviço.');
  }

  if (quote.status === data.status) {
    return quote;
  }

  // Validação da máquina de estados
  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ['SENT', 'REJECTED'],
    SENT: ['APPROVED', 'REJECTED', 'EXPIRED'],
    APPROVED: [], // Deve prosseguir para conversão em OS
    REJECTED: [],
    EXPIRED: [],
  };

  const allowed = allowedTransitions[quote.status] || [];
  if (!allowed.includes(data.status)) {
    if (quote.status === 'APPROVED') {
      throw createHttpError(400, 'Orçamento já aprovado. Prossiga com a conversão em Ordem de Serviço.');
    }
    if (quote.status === 'REJECTED' || quote.status === 'EXPIRED') {
      throw createHttpError(400, `Não é possível alterar o status de um orçamento ${quote.status.toLowerCase()}.`);
    }
    throw createHttpError(
      400,
      `Transição de status inválida de ${quote.status} para ${data.status}.`
    );
  }

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      status: data.status,
      ...(data.notes ? { notes: quote.notes ? `${quote.notes}\n[Status: ${data.status}] ${data.notes}` : `[Status: ${data.status}] ${data.notes}` } : {}),
    },
    include: {
      customer: true,
      technician: true,
      items: {
        include: {
          product: true,
        },
      },
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
    },
  });

  return updated;
}

export async function convertToWorkOrder(
  prisma: PrismaClient,
  quoteId: string,
  options?: { technicianId?: string; scheduledDate?: string; userId?: string }
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: true,
      customer: true,
    },
  });

  if (!quote) {
    throw createHttpError(404, 'Orçamento não encontrado.');
  }

  if (quote.workOrderId) {
    throw createHttpError(409, `Este orçamento já foi convertido na Ordem de Serviço ${quote.workOrderId}.`);
  }

  if (quote.status === 'REJECTED' || quote.status === 'EXPIRED') {
    throw createHttpError(400, `Não é possível converter um orçamento com status "${quote.status}".`);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Validação de estoque para peças vinculadas ao catálogo
    for (const item of quote.items) {
      if (item.type === 'PART' && item.productId) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw createHttpError(404, `Produto ${item.productId} não encontrado no catálogo.`);
        }

        if (product.currentStock < item.quantity) {
          throw createHttpError(
            400,
            `Estoque insuficiente para o produto "${product.name}" (SKU: ${product.sku}). Saldo disponível: ${product.currentStock}, Solicitado: ${item.quantity}.`
          );
        }

        // Baixa no estoque físico
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // 2. Geração sequencial de número de OS
    const orderNumber = await generateOrderNumber(tx);

    // 3. Criação da WorkOrder definitiva
    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber,
        customerId: quote.customerId,
        technicianId: options?.technicianId ?? quote.technicianId ?? null,
        equipment: quote.equipment,
        serialNumber: quote.serialNumber,
        reportedDefect: quote.reportedDefect,
        technicalDiagnosis: quote.technicalDiagnosis,
        status: 'OPEN',
        priority: 'MEDIUM',
        totalServices: quote.totalServices,
        totalParts: quote.totalParts,
        discount: quote.discount,
        totalAmount: quote.totalAmount,
        scheduledDate: options?.scheduledDate ? new Date(options.scheduledDate) : null,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
        logs: {
          create: {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: `Ordem de serviço gerada a partir da conversão do orçamento ${quote.quoteNumber}.`,
            createdBy: options?.userId || 'SYSTEM',
          },
        },
      },
      include: {
        customer: true,
        technician: true,
        items: true,
        logs: true,
      },
    });

    // 4. Registro das movimentações de estoque (OUT)
    for (const item of quote.items) {
      if (item.type === 'PART' && item.productId) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            workOrderId: workOrder.id,
            type: 'OUT',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            reason: `Conversão do Orçamento ${quote.quoteNumber} para OS ${orderNumber}`,
            createdBy: options?.userId || 'SYSTEM',
          },
        });
      }
    }

    // 5. Atualização do Orçamento para APPROVED com vínculo da OS
    const updatedQuote = await tx.quote.update({
      where: { id: quote.id },
      data: {
        status: 'APPROVED',
        workOrderId: workOrder.id,
      },
      include: {
        customer: true,
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      workOrder,
      quote: updatedQuote,
    };
  });
}
