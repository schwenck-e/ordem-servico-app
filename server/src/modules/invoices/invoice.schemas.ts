import { z } from 'zod';

// ─── Enums de Domínio ───────────────────────────────────────────────────────

export const invoiceStatusEnum = z.enum([
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELED',
]);

export const paymentMethodEnum = z.enum([
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'BANK_SLIP',
]);

export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

// ─── Schemas de Fatura (Invoice) ────────────────────────────────────────────

export const createInvoiceSchema = z
  .object({
    workOrderId: z
      .string()
      .uuid('Identificador da ordem de serviço inválido (UUID esperado)')
      .optional()
      .nullable(),
    quoteId: z
      .string()
      .uuid('Identificador do orçamento inválido (UUID esperado)')
      .optional()
      .nullable(),
    customerId: z
      .string()
      .uuid('Identificador do cliente inválido (UUID esperado)')
      .optional(),
    amount: z
      .number()
      .min(0, 'Valor total bruto não pode ser negativo')
      .optional(),
    discount: z
      .number()
      .min(0, 'Desconto não pode ser negativo')
      .default(0)
      .optional(),
    dueDate: z
      .coerce
      .date()
      .optional(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Observações devem ter no máximo 1000 caracteres')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => Boolean(data.workOrderId || data.quoteId || (data.customerId && data.amount !== undefined)),
    {
      message: 'É obrigatório informar workOrderId, quoteId ou customerId juntamente com o amount.',
      path: ['workOrderId'],
    }
  );

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: invoiceStatusEnum.optional(),
  customerId: z.string().uuid().optional(),
  workOrderId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().trim().optional(),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().uuid('Identificador da fatura inválido (UUID esperado)'),
});

export const cancelInvoiceSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'O motivo do cancelamento deve ter no mínimo 3 caracteres')
    .max(500, 'O motivo do cancelamento deve ter no máximo 500 caracteres')
    .optional(),
});

// ─── Schemas de Pagamento (Payment) ─────────────────────────────────────────

export const createPaymentSchema = z.object({
  amount: z
    .number()
    .positive('O valor do pagamento deve ser maior que zero'),
  paymentMethod: paymentMethodEnum,
  paidAt: z
    .coerce
    .date()
    .default(() => new Date())
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .nullable(),
});

// ─── Tipos Inferidos ────────────────────────────────────────────────────────

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ─── Schemas Swagger / OpenAPI ──────────────────────────────────────────────

export const createInvoiceSwaggerSchema = {
  tags: ['Invoices'],
  summary: 'Criar nova fatura a partir de Ordem de Serviço concluída ou Orçamento',
  description: 'Gera uma nova fatura com protocolo sequencial anual (ex.: FAT-2026-0001).',
  security: [{ bearerAuth: [] }],
};

export const listInvoicesSwaggerSchema = {
  tags: ['Invoices'],
  summary: 'Listar faturas com paginação e filtros',
  description: 'Retorna a listagem paginada de faturas com filtros por status, cliente e datas.',
  security: [{ bearerAuth: [] }],
};

export const getInvoiceSwaggerSchema = {
  tags: ['Invoices'],
  summary: 'Buscar fatura por ID',
  description: 'Retorna detalhes da fatura, cliente, OS/orçamento vinculado e histórico de pagamentos.',
  security: [{ bearerAuth: [] }],
};

export const cancelInvoiceSwaggerSchema = {
  tags: ['Invoices'],
  summary: 'Cancelar fatura',
  description: 'Cancela uma fatura pendente sem pagamentos associados.',
  security: [{ bearerAuth: [] }],
};

export const createPaymentSwaggerSchema = {
  tags: ['Invoices'],
  summary: 'Registrar pagamento para uma fatura',
  description: 'Processa amortização ou quitação da fatura com transição de status automática.',
  security: [{ bearerAuth: [] }],
};
