import { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateWorkOrderInput,
  CreateWorkOrderItemInput,
  UpdateWorkOrderInput,
  ListWorkOrdersQuery,
} from './work-order.schemas';

// ─── Domain Error Helper ────────────────────────────────────────────────────

export function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ─── Financial Calculations ─────────────────────────────────────────────────

export function calculateOrderTotals(items: CreateWorkOrderItemInput[], discount: number = 0) {
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
      `O desconto (R$ ${discount.toFixed(2)}) não pode ser superior ao valor total dos itens (R$ ${grossTotal.toFixed(2)}).`
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

export async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `OS-${currentYear}-`;

  const lastOrder = await tx.workOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let nextSeq = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split('-');
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

export async function createWorkOrder(
  prisma: PrismaClient,
  data: CreateWorkOrderInput
) {
  // 1. Validar cliente existente
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });

  if (!customer) {
    throw createHttpError(404, 'Cliente não encontrado.');
  }

  // 2. Validar técnico (se informado)
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
    calculateOrderTotals(data.items, data.discount ?? 0);

  // 4. Executar transação atômica
  return prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);

    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        technicianId: data.technicianId ?? null,
        equipment: data.equipment,
        serialNumber: data.serialNumber ?? null,
        reportedDefect: data.reportedDefect,
        status: 'OPEN',
        priority: data.priority ?? 'MEDIUM',
        totalServices,
        totalParts,
        discount,
        totalAmount,
        scheduledDate: data.scheduledDate ?? null,
        items: {
          create: calculatedItems.map((item) => ({
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
            comment: data.initialComment || 'Ordem de serviço registrada no sistema.',
            createdBy: 'SYSTEM',
          },
        },
      },
      include: {
        customer: true,
        technician: true,
        items: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return workOrder;
  });
}

export async function listWorkOrders(
  prisma: PrismaClient,
  query: ListWorkOrdersQuery
) {
  const where: Prisma.WorkOrderWhereInput = {};

  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search } },
      { equipment: { contains: query.search } },
      { reportedDefect: { contains: query.search } },
      { serialNumber: { contains: query.search } },
      { customer: { name: { contains: query.search } } },
    ];
  }

  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }

  if (query.priority && query.priority !== 'all') {
    where.priority = query.priority;
  }

  if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.technicianId !== undefined) {
    if (query.technicianId === 'unassigned') {
      where.technicianId = null;
    } else if (query.technicianId.trim() !== '') {
      where.technicianId = query.technicianId;
    }
  }

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) {
      where.createdAt.gte = query.startDate;
    }
    if (query.endDate) {
      where.createdAt.lte = query.endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
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
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getWorkOrderById(prisma: PrismaClient, id: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      technician: true,
      items: true,
      logs: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!workOrder) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  return workOrder;
}

export async function updateWorkOrder(
  prisma: PrismaClient,
  id: string,
  data: UpdateWorkOrderInput
) {
  // 1. Verificar se a OS existe
  const current = await prisma.workOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!current) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  // 2. Se cliente informado, validar existência
  if (data.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw createHttpError(404, 'Cliente não encontrado.');
    }
  }

  // 3. Se técnico informado, validar existência e status ativo
  if (data.technicianId !== undefined) {
    if (data.technicianId !== null) {
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
  }

  // 4. Cenário A: Itens foram fornecidos para substituição
  if (data.items) {
    const effectiveDiscount = data.discount !== undefined ? data.discount : current.discount;
    const totals = calculateOrderTotals(data.items, effectiveDiscount);

    await prisma.$transaction(async (tx) => {
      // Deletar itens antigos
      await tx.workOrderItem.deleteMany({
        where: { workOrderId: id },
      });

      // Criar novos itens
      await tx.workOrderItem.createMany({
        data: totals.items.map((item) => ({
          workOrderId: id,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });

      // Atualizar dados cadastrais e totais
      await tx.workOrder.update({
        where: { id },
        data: {
          ...(data.customerId ? { customerId: data.customerId } : {}),
          ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
          ...(data.equipment ? { equipment: data.equipment } : {}),
          ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
          ...(data.reportedDefect ? { reportedDefect: data.reportedDefect } : {}),
          ...(data.technicalDiagnosis !== undefined ? { technicalDiagnosis: data.technicalDiagnosis } : {}),
          ...(data.priority ? { priority: data.priority } : {}),
          ...(data.scheduledDate !== undefined ? { scheduledDate: data.scheduledDate } : {}),
          totalServices: totals.totalServices,
          totalParts: totals.totalParts,
          discount: totals.discount,
          totalAmount: totals.totalAmount,
        },
      });
    });

    return getWorkOrderById(prisma, id);
  }

  // 5. Cenário B: Itens NÃO fornecidos, mas desconto foi alterado
  if (data.discount !== undefined) {
    const existingItemsInput: CreateWorkOrderItemInput[] = current.items.map((i) => ({
      type: i.type as 'SERVICE' | 'PART',
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const totals = calculateOrderTotals(existingItemsInput, data.discount);

    await prisma.workOrder.update({
      where: { id },
      data: {
        ...(data.customerId ? { customerId: data.customerId } : {}),
        ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
        ...(data.equipment ? { equipment: data.equipment } : {}),
        ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
        ...(data.reportedDefect ? { reportedDefect: data.reportedDefect } : {}),
        ...(data.technicalDiagnosis !== undefined ? { technicalDiagnosis: data.technicalDiagnosis } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.scheduledDate !== undefined ? { scheduledDate: data.scheduledDate } : {}),
        totalServices: totals.totalServices,
        totalParts: totals.totalParts,
        discount: totals.discount,
        totalAmount: totals.totalAmount,
      },
    });

    return getWorkOrderById(prisma, id);
  }

  // 6. Cenário C: Apenas atualização cadastral (sem itens e sem alteração de desconto)
  await prisma.workOrder.update({
    where: { id },
    data: {
      ...(data.customerId ? { customerId: data.customerId } : {}),
      ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
      ...(data.equipment ? { equipment: data.equipment } : {}),
      ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
      ...(data.reportedDefect ? { reportedDefect: data.reportedDefect } : {}),
      ...(data.technicalDiagnosis !== undefined ? { technicalDiagnosis: data.technicalDiagnosis } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.scheduledDate !== undefined ? { scheduledDate: data.scheduledDate } : {}),
    },
  });

  return getWorkOrderById(prisma, id);
}
