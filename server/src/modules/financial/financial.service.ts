import { PrismaClient } from '@prisma/client';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  PayTransactionInput,
  CashflowQuery,
} from './financial.schemas';

export function createHttpError(
  statusCode: number,
  message: string
): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function createTransaction(
  prisma: PrismaClient,
  data: CreateTransactionInput
) {
  const amount = roundCents(data.amount);

  if (amount <= 0) {
    throw createHttpError(400, 'O valor da transação deve ser positivo e maior que zero.');
  }

  if (data.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
    });
    if (!invoice) {
      throw createHttpError(404, 'Fatura associada não encontrada.');
    }
  }

  const status = data.status || 'PENDING';
  let paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;

  if (status === 'PAID' && !paymentDate) {
    paymentDate = new Date();
  }

  return prisma.financialTransaction.create({
    data: {
      type: data.type,
      category: data.category,
      description: data.description,
      amount,
      dueDate: new Date(data.dueDate),
      paymentDate,
      status,
      invoiceId: data.invoiceId ?? null,
    },
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      },
    },
  });
}

export async function listTransactions(
  prisma: PrismaClient,
  query: ListTransactionsQuery
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.type) {
    where.type = query.type;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.startDate || query.endDate) {
    where.dueDate = {};
    if (query.startDate) {
      where.dueDate.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const adjustedEndDate = new Date(query.endDate);
      if (
        adjustedEndDate.getUTCHours() === 0 &&
        adjustedEndDate.getUTCMinutes() === 0 &&
        adjustedEndDate.getUTCSeconds() === 0
      ) {
        adjustedEndDate.setUTCHours(23, 59, 59, 999);
      }
      where.dueDate.lte = adjustedEndDate;
    }
  }

  if (query.search) {
    where.description = {
      contains: query.search,
    };
  }

  const [total, data] = await Promise.all([
    prisma.financialTransaction.count({ where }),
    prisma.financialTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
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
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getTransactionById(prisma: PrismaClient, id: string) {
  const transaction = await prisma.financialTransaction.findUnique({
    where: { id },
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          amount: true,
          paidAmount: true,
        },
      },
    },
  });

  if (!transaction) {
    throw createHttpError(404, 'Transação financeira não encontrada.');
  }

  return transaction;
}

export async function payTransaction(
  prisma: PrismaClient,
  id: string,
  data?: PayTransactionInput
) {
  const transaction = await prisma.financialTransaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw createHttpError(404, 'Transação financeira não encontrada.');
  }

  if (transaction.status === 'PAID') {
    throw createHttpError(400, 'Esta transação já foi liquidada/paga.');
  }

  if (transaction.status === 'CANCELED') {
    throw createHttpError(400, 'Não é possível liquidar uma transação cancelada.');
  }

  const paymentDate = data?.paymentDate ? new Date(data.paymentDate) : new Date();

  return prisma.financialTransaction.update({
    where: { id },
    data: {
      status: 'PAID',
      paymentDate,
    },
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      },
    },
  });
}

export async function getCashflow(prisma: PrismaClient, query: CashflowQuery) {
  // 1. Saldo Consolidado Atual Realizado (Global de transações PAID)
  const [paidRevenuesSum, paidExpensesSum] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { type: 'REVENUE', status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { type: 'EXPENSE', status: 'PAID' },
      _sum: { amount: true },
    }),
  ]);

  const totalPaidRevenue = roundCents(paidRevenuesSum._sum.amount ?? 0);
  const totalPaidExpense = roundCents(paidExpensesSum._sum.amount ?? 0);
  const currentBalance = roundCents(totalPaidRevenue - totalPaidExpense);

  // 2. Período Selecionado
  const now = new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  let endDate: Date;
  if (query.endDate) {
    const adjusted = new Date(query.endDate);
    if (
      adjusted.getUTCHours() === 0 &&
      adjusted.getUTCMinutes() === 0 &&
      adjusted.getUTCSeconds() === 0
    ) {
      adjusted.setUTCHours(23, 59, 59, 999);
    }
    endDate = adjusted;
  } else {
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const [toPayAgg, toReceiveAgg, periodPaidRevAgg, periodPaidExpAgg] =
    await Promise.all([
      // Total a pagar pendente no período por dueDate
      prisma.financialTransaction.aggregate({
        where: {
          type: 'EXPENSE',
          status: 'PENDING',
          dueDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      // Total a receber pendente no período por dueDate
      prisma.financialTransaction.aggregate({
        where: {
          type: 'REVENUE',
          status: 'PENDING',
          dueDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      // Receita realizada no período por paymentDate
      prisma.financialTransaction.aggregate({
        where: {
          type: 'REVENUE',
          status: 'PAID',
          paymentDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      // Despesa realizada no período por paymentDate
      prisma.financialTransaction.aggregate({
        where: {
          type: 'EXPENSE',
          status: 'PAID',
          paymentDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

  const totalToPay = roundCents(toPayAgg._sum.amount ?? 0);
  const totalToReceive = roundCents(toReceiveAgg._sum.amount ?? 0);
  const paidRevenue = roundCents(periodPaidRevAgg._sum.amount ?? 0);
  const paidExpense = roundCents(periodPaidExpAgg._sum.amount ?? 0);
  const periodBalance = roundCents(paidRevenue - paidExpense);

  // 3. Projeção Mensal para Gráficos
  // Gera os últimos 6 meses (ou o range entre startDate e endDate, mínimo 6 meses)
  const monthKeys: string[] = [];
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthKeys.push(key);
  }

  const monthlyTransactions = await prisma.financialTransaction.findMany({
    where: {
      status: 'PAID',
      paymentDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: {
      type: true,
      amount: true,
      paymentDate: true,
    },
  });

  const monthMap = new Map<string, { revenue: number; expense: number }>();
  for (const key of monthKeys) {
    monthMap.set(key, { revenue: 0, expense: 0 });
  }

  for (const t of monthlyTransactions) {
    if (!t.paymentDate) continue;
    const key = `${t.paymentDate.getFullYear()}-${String(
      t.paymentDate.getMonth() + 1
    ).padStart(2, '0')}`;
    const entry = monthMap.get(key);
    if (entry) {
      if (t.type === 'REVENUE') {
        entry.revenue += t.amount;
      } else if (t.type === 'EXPENSE') {
        entry.expense += t.amount;
      }
    }
  }

  const monthly = monthKeys.map((key) => {
    const entry = monthMap.get(key) || { revenue: 0, expense: 0 };
    const rev = roundCents(entry.revenue);
    const exp = roundCents(entry.expense);
    return {
      month: key,
      revenue: rev,
      expense: exp,
      netBalance: roundCents(rev - exp),
    };
  });

  return {
    currentBalance,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalToPay,
      totalToReceive,
      paidRevenue,
      paidExpense,
      periodBalance,
    },
    monthly,
  };
}
