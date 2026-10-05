import { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateInvoiceInput,
  ListInvoicesQuery,
  CancelInvoiceInput,
} from './invoice.schemas';

export function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function generateInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `FAT-${currentYear}-`;

  const lastInvoice = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

export async function createInvoice(prisma: PrismaClient, data: CreateInvoiceInput) {
  let customerId = data.customerId;
  let grossAmount = data.amount ?? 0;
  let discount = data.discount ?? 0;

  // 1. Cenário: Faturamento de Ordem de Serviço
  if (data.workOrderId) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: data.workOrderId },
      include: { customer: true },
    });

    if (!workOrder) {
      throw createHttpError(404, 'Ordem de serviço não encontrada.');
    }

    if (workOrder.status !== 'COMPLETED') {
      throw createHttpError(
        400,
        `Apenas ordens de serviço concluídas (COMPLETED) podem ser faturadas. Status atual: ${workOrder.status}.`
      );
    }

    const existingActiveInvoice = await prisma.invoice.findFirst({
      where: {
        workOrderId: data.workOrderId,
        status: { not: 'CANCELED' },
      },
    });

    if (existingActiveInvoice) {
      throw createHttpError(
        409,
        `Esta ordem de serviço já possui uma fatura ativa (${existingActiveInvoice.invoiceNumber}).`
      );
    }

    customerId = workOrder.customerId;
    if (data.amount === undefined) {
      grossAmount = Math.round((workOrder.totalServices + workOrder.totalParts) * 100) / 100;
    }
    if (data.discount === undefined) {
      discount = workOrder.discount;
    }
  }

  // 2. Cenário: Faturamento de Orçamento
  if (data.quoteId && !data.workOrderId) {
    const quote = await prisma.quote.findUnique({
      where: { id: data.quoteId },
      include: { customer: true },
    });

    if (!quote) {
      throw createHttpError(404, 'Orçamento não encontrado.');
    }

    if (quote.status !== 'APPROVED') {
      throw createHttpError(
        400,
        `Apenas orçamentos aprovados (APPROVED) podem ser faturados. Status atual: ${quote.status}.`
      );
    }

    const existingActiveInvoice = await prisma.invoice.findFirst({
      where: {
        quoteId: data.quoteId,
        status: { not: 'CANCELED' },
      },
    });

    if (existingActiveInvoice) {
      throw createHttpError(
        409,
        `Este orçamento já possui uma fatura ativa (${existingActiveInvoice.invoiceNumber}).`
      );
    }

    customerId = quote.customerId;
    if (data.amount === undefined) {
      grossAmount = Math.round((quote.totalServices + quote.totalParts) * 100) / 100;
    }
    if (data.discount === undefined) {
      discount = quote.discount;
    }
  }

  if (!customerId) {
    throw createHttpError(400, 'Não foi possível determinar o cliente da fatura.');
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw createHttpError(404, 'Cliente associado não encontrado.');
  }

  if (discount < 0) {
    throw createHttpError(400, 'O valor de desconto não pode ser negativo.');
  }

  if (discount > grossAmount) {
    throw createHttpError(
      400,
      `O desconto (R$ ${discount.toFixed(2)}) não pode ser superior ao valor bruto da fatura (R$ ${grossAmount.toFixed(2)}).`
    );
  }

  const netAmount = Math.round((grossAmount - discount) * 100) / 100;
  const dueDate = data.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber(tx);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: customerId!,
        workOrderId: data.workOrderId ?? null,
        quoteId: data.quoteId ?? null,
        amount: grossAmount,
        discount,
        netAmount,
        paidAmount: 0.0,
        status: 'PENDING',
        dueDate,
        notes: data.notes ?? null,
      },
      include: {
        customer: true,
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            equipment: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
          },
        },
        payments: true,
      },
    });

    return invoice;
  });
}

export async function listInvoices(prisma: PrismaClient, query: ListInvoicesQuery) {
  const { page, limit, status, customerId, workOrderId, startDate, endDate, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (workOrderId) where.workOrderId = workOrderId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { document: { contains: search } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paidAt: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getInvoiceById(prisma: PrismaClient, id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      workOrder: {
        include: {
          technician: true,
          items: true,
        },
      },
      quote: {
        include: {
          items: true,
        },
      },
      payments: {
        orderBy: { paidAt: 'desc' },
      },
    },
  });

  if (!invoice) {
    throw createHttpError(404, 'Fatura não encontrada.');
  }

  const remainingBalance = Math.round((invoice.netAmount - invoice.paidAmount) * 100) / 100;

  return {
    ...invoice,
    remainingBalance: Math.max(0, remainingBalance),
  };
}

export async function cancelInvoice(prisma: PrismaClient, id: string, data?: CancelInvoiceInput) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (!invoice) {
    throw createHttpError(404, 'Fatura não encontrada.');
  }

  if (invoice.status === 'CANCELED') {
    throw createHttpError(400, 'A fatura já se encontra cancelada.');
  }

  if (invoice.status === 'PAID') {
    throw createHttpError(400, 'Não é possível cancelar uma fatura quitada.');
  }

  if (invoice.payments.length > 0 || invoice.paidAmount > 0) {
    throw createHttpError(
      400,
      'Não é possível cancelar uma fatura com pagamentos já registrados. É necessário estornar os pagamentos previamente.'
    );
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: 'CANCELED',
      notes: data?.reason
        ? invoice.notes
          ? `${invoice.notes}\n[Cancelamento] ${data.reason}`
          : `[Cancelamento] ${data.reason}`
        : invoice.notes,
    },
    include: {
      customer: true,
      payments: true,
    },
  });

  return updated;
}
