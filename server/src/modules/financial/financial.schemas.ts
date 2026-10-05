import { z } from 'zod';

// ─── Enums de Domínio ───────────────────────────────────────────────────────

export const financialTransactionTypeEnum = z.enum(['REVENUE', 'EXPENSE']);

export const financialTransactionStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'CANCELED',
]);

export const financialTransactionCategoryEnum = z.enum([
  'FIXED_EXPENSE',
  'VARIABLE_EXPENSE',
  'PARTS_PURCHASE',
  'SERVICE_REVENUE',
  'OTHER',
]);

export type FinancialTransactionType = z.infer<
  typeof financialTransactionTypeEnum
>;
export type FinancialTransactionStatus = z.infer<
  typeof financialTransactionStatusEnum
>;
export type FinancialTransactionCategory = z.infer<
  typeof financialTransactionCategoryEnum
>;

// ─── Schemas de Requisição ──────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  type: financialTransactionTypeEnum,
  category: financialTransactionCategoryEnum,
  description: z
    .string()
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z
    .number()
    .gt(0, 'Valor deve ser maior que zero (positivo)'),
  dueDate: z.coerce.date({
    errorMap: () => ({ message: 'Data de vencimento inválida' }),
  }),
  paymentDate: z.coerce.date().optional().nullable(),
  status: financialTransactionStatusEnum.optional().default('PENDING'),
  invoiceId: z
    .string()
    .uuid('Identificador da fatura inválido (UUID esperado)')
    .optional()
    .nullable(),
});

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: financialTransactionTypeEnum.optional(),
  status: financialTransactionStatusEnum.optional(),
  category: financialTransactionCategoryEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().trim().optional(),
});

export const transactionIdParamSchema = z.object({
  id: z.string().uuid('Identificador da transação inválido (UUID esperado)'),
});

export const payTransactionSchema = z.object({
  paymentDate: z.coerce.date().optional(),
});

export const cashflowQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ─── Tipos Inferidos ────────────────────────────────────────────────────────

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type TransactionIdParam = z.infer<typeof transactionIdParamSchema>;
export type PayTransactionInput = z.infer<typeof payTransactionSchema>;
export type CashflowQuery = z.infer<typeof cashflowQuerySchema>;

// ─── Schemas Swagger / OpenAPI ──────────────────────────────────────────────

export const listTransactionsSwaggerSchema = {
  tags: ['Financial'],
  summary: 'Listar transações financeiras com filtros e paginação',
  description:
    'Retorna o livro-caixa de contas a pagar e a receber com filtros por tipo, status, categoria, datas e texto.',
  security: [{ bearerAuth: [] }],
};

export const createTransactionSwaggerSchema = {
  tags: ['Financial'],
  summary: 'Criar transação financeira avulsa (Apenas ADMIN)',
  description:
    'Permite que administradores realizem lançamentos manuais de despesas ou receitas.',
  security: [{ bearerAuth: [] }],
};

export const payTransactionSwaggerSchema = {
  tags: ['Financial'],
  summary: 'Baixar / Liquidar transação financeira pendente',
  description:
    'Registra a liquidação/pagamento de uma transação financeira pendente e atualiza a data de pagamento.',
  security: [{ bearerAuth: [] }],
};

export const getCashflowSwaggerSchema = {
  tags: ['Financial'],
  summary: 'Consultar resumo e projeção de fluxo de caixa',
  description:
    'Retorna o saldo consolidado realizado, total a pagar e a receber no período, e gráfico mensal.',
  security: [{ bearerAuth: [] }],
};
