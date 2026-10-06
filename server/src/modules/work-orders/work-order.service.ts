import { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateWorkOrderInput,
  CreateWorkOrderItemInput,
  UpdateWorkOrderInput,
  UpdateWorkOrderStatusInput,
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

    // Validação e baixa prévia de estoque para peças vinculadas ao catálogo
    for (const item of calculatedItems) {
      if (item.type === 'PART' && item.productId) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw createHttpError(404, `Produto ${item.productId} não encontrado.`);
        }

        if (product.currentStock < item.quantity) {
          throw createHttpError(
            400,
            `Estoque insuficiente para o produto "${product.name}" (SKU: ${product.sku}). Saldo disponível: ${product.currentStock}, Solicitado: ${item.quantity}.`
          );
        }

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
            productId: item.productId ?? null,
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

    // Registrar movimentações de saída para peças baixadas
    for (const item of calculatedItems) {
      if (item.type === 'PART' && item.productId) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            workOrderId: workOrder.id,
            type: 'OUT',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            reason: `Baixa automática por aplicação na OS ${orderNumber}`,
            createdBy: data.technicianId || 'SYSTEM',
          },
        });
      }
    }

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
      attachments: {
        orderBy: { createdAt: 'desc' },
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
      // 1. Estornar peças antigas associadas ao catálogo
      for (const oldItem of current.items) {
        if (oldItem.type === 'PART' && oldItem.productId) {
          await tx.product.update({
            where: { id: oldItem.productId },
            data: { currentStock: { increment: oldItem.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: oldItem.productId,
              workOrderId: id,
              type: 'IN',
              quantity: oldItem.quantity,
              unitPrice: oldItem.unitPrice,
              reason: `Estorno por alteração nos itens da OS ${current.orderNumber}`,
              createdBy: 'SYSTEM',
            },
          });
        }
      }

      // 2. Deletar itens antigos
      await tx.workOrderItem.deleteMany({
        where: { workOrderId: id },
      });

      // 3. Validar e debitar estoque para novos itens de peças
      for (const item of totals.items) {
        if (item.type === 'PART' && item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw createHttpError(404, `Produto ${item.productId} não encontrado.`);
          }

          if (product.currentStock < item.quantity) {
            throw createHttpError(
              400,
              `Estoque insuficiente para o produto "${product.name}" (SKU: ${product.sku}). Saldo disponível: ${product.currentStock}, Solicitado: ${item.quantity}.`
            );
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              workOrderId: id,
              type: 'OUT',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              reason: `Baixa automática por alteração nos itens da OS ${current.orderNumber}`,
              createdBy: data.technicianId || 'SYSTEM',
            },
          });
        }
      }

      // 4. Criar novos itens com productId
      await tx.workOrderItem.createMany({
        data: totals.items.map((item) => ({
          workOrderId: id,
          productId: item.productId ?? null,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });

      // 5. Atualizar dados cadastrais e totais
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
      productId: i.productId,
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

// ─── Máquina de Estados e Workflow de Status ────────────────────────────────

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELED'],
  WAITING_APPROVAL: ['IN_PROGRESS', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

export async function updateWorkOrderStatus(
  prisma: PrismaClient,
  id: string,
  data: UpdateWorkOrderStatusInput
) {
  // 1. Buscar OS existente com técnico e cliente associados
  const current = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      technician: true,
      customer: true,
    },
  });

  if (!current) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  // 2. Validação: transição para o mesmo status
  if (current.status === data.status) {
    throw createHttpError(
      400,
      `A ordem de serviço já se encontra no status ${current.status}.`
    );
  }

  // 3. Validação: estados terminais (COMPLETED e CANCELED não sofrem transição)
  if (current.status === 'COMPLETED' || current.status === 'CANCELED') {
    throw createHttpError(
      400,
      `Não é possível alterar o status de uma ordem de serviço ${
        current.status === 'COMPLETED' ? 'concluída' : 'cancelada'
      }.`
    );
  }

  // 4. Validação: matriz de transições permitidas
  const allowedTransitions = VALID_STATUS_TRANSITIONS[current.status] || [];
  if (!allowedTransitions.includes(data.status)) {
    throw createHttpError(
      400,
      `Transição de status inválida: de ${current.status} para ${data.status}.`
    );
  }

  // 5. Validação de técnico quando informado explicitamente
  let effectiveTechnician = current.technician;
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

    effectiveTechnician = technician;
  }

  // 6. Regra de negócio: IN_PROGRESS exige técnico responsável ativo
  if (data.status === 'IN_PROGRESS') {
    const targetTechnicianId = data.technicianId ?? current.technicianId;
    if (!targetTechnicianId) {
      throw createHttpError(
        400,
        'É obrigatório atribuir um técnico responsável para iniciar o atendimento da ordem de serviço.'
      );
    }

    if (effectiveTechnician && !effectiveTechnician.isActive) {
      throw createHttpError(
        400,
        'O técnico responsável atualmente atribuído está inativo.'
      );
    }
  }

  // 7. Regra de negócio: COMPLETED exige laudo técnico (já na OS ou enviado agora)
  if (data.status === 'COMPLETED') {
    const diagnosis = data.technicalDiagnosis?.trim() || current.technicalDiagnosis?.trim();
    if (!diagnosis) {
      throw createHttpError(
        400,
        'Diagnóstico técnico é obrigatório para concluir a ordem de serviço.'
      );
    }
  }

  // 8. Regra de negócio: CANCELED exige justificativa
  if (data.status === 'CANCELED') {
    if (!data.comment || data.comment.trim() === '') {
      throw createHttpError(
        400,
        'É obrigatório informar uma justificativa para o cancelamento da ordem de serviço.'
      );
    }
  }

  // 9. Regra de negócio: WAITING_PARTS exige justificativa
  if (data.status === 'WAITING_PARTS') {
    if (!data.comment || data.comment.trim() === '') {
      throw createHttpError(
        400,
        'É obrigatório informar o motivo/peças pendentes ao colocar a ordem de serviço em espera.'
      );
    }
  }

  // 10. Montagem dos dados de auditoria
  const logComment =
    data.comment?.trim() ||
    `Status alterado de ${current.status} para ${data.status}.`;
  const logCreatedBy =
    data.createdBy?.trim() ||
    effectiveTechnician?.name ||
    'SYSTEM';

  // 11. Execução transacional atômica
  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.status === 'COMPLETED' ? { completedDate: new Date() } : {}),
        ...(data.technicalDiagnosis !== undefined
          ? { technicalDiagnosis: data.technicalDiagnosis?.trim() ?? null }
          : {}),
        ...(data.technicianId !== undefined
          ? { technicianId: data.technicianId }
          : {}),
      },
    });

    await tx.workOrderLog.create({
      data: {
        workOrderId: id,
        previousStatus: current.status,
        newStatus: data.status,
        comment: logComment,
        createdBy: logCreatedBy,
      },
    });
  });

  return getWorkOrderById(prisma, id);
}

// ─── Linha do Tempo e Histórico de Auditoria ────────────────────────────────

export async function getWorkOrderTimeline(prisma: PrismaClient, id: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!workOrder) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  return prisma.workOrderLog.findMany({
    where: { workOrderId: id },
    orderBy: { createdAt: 'asc' },
  });
}

