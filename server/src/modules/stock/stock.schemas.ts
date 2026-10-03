import { z } from 'zod';

// ─── Enums & Subschemas ─────────────────────────────────────────────────────

export const stockMovementTypeEnum = z.enum(['IN', 'OUT', 'ADJUSTMENT']);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const createStockMovementSchema = z.object({
  productId: z.string().uuid('ID do produto inválido (UUID esperado)'),
  type: stockMovementTypeEnum,
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero'),
  unitPrice: z
    .number()
    .min(0, 'Valor unitário não pode ser negativo')
    .optional(),
  reason: z
    .string()
    .trim()
    .min(3, 'Motivo deve ter no mínimo 3 caracteres')
    .max(255, 'Motivo deve ter no máximo 255 caracteres'),
});

export const listStockMovementsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Página mínima é 1')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limite mínimo é 1')
    .max(100, 'Limite máximo é 100')
    .default(10),
  productId: z.string().uuid('ID do produto inválido').optional(),
  type: stockMovementTypeEnum.optional(),
  workOrderId: z.string().uuid('ID da OS inválido').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type StockMovementType = z.infer<typeof stockMovementTypeEnum>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type ListStockMovementsQuery = z.infer<typeof listStockMovementsQuerySchema>;

// ─── Swagger / OpenAPI Schemas ──────────────────────────────────────────────

export const createStockMovementSwaggerSchema = {
  tags: ['Stock'],
  summary: 'Registrar movimentação avulsa de estoque',
  description: 'Registra uma entrada (IN), saída/perda (OUT) ou ajuste de balanço (ADJUSTMENT), atualizando o saldo do produto atomicamente.',
  security: [{ bearerAuth: [] }],
};

export const listStockMovementsSwaggerSchema = {
  tags: ['Stock'],
  summary: 'Consultar histórico de movimentações de estoque',
  description: 'Retorna a listagem paginada e auditável de movimentações de estoque com filtros por produto, tipo, OS e período.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, minimum: 1 },
      limit: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
      productId: { type: 'string', format: 'uuid', description: 'Filtrar por ID do produto' },
      type: { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT'], description: 'Filtrar por tipo de movimentação' },
      workOrderId: { type: 'string', format: 'uuid', description: 'Filtrar por ID da ordem de serviço' },
      startDate: { type: 'string', format: 'date-time', description: 'Data inicial (ISO 8601)' },
      endDate: { type: 'string', format: 'date-time', description: 'Data final (ISO 8601)' },
    },
  },
};
