import { z } from 'zod';

// ─── Enums de Domínio ───────────────────────────────────────────────────────

export const quoteStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
]);

export const quoteItemTypeEnum = z.enum([
  'SERVICE',
  'PART',
]);

// ─── Itens do Orçamento ─────────────────────────────────────────────────────

export const createQuoteItemSchema = z.object({
  productId: z
    .string()
    .uuid('Identificador do produto inválido (UUID v4 esperado)')
    .optional()
    .nullable(),
  type: quoteItemTypeEnum,
  description: z
    .string()
    .trim()
    .min(2, 'Descrição do item deve ter no mínimo 2 caracteres')
    .max(255, 'Descrição do item deve ter no máximo 255 caracteres'),
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1')
    .default(1),
  unitPrice: z
    .number()
    .min(0, 'Preço unitário não pode ser negativo'),
});

// ─── Criação de Orçamento ───────────────────────────────────────────────────

export const createQuoteSchema = z.object({
  customerId: z
    .string()
    .uuid('Identificador do cliente inválido (UUID v4 esperado)'),
  technicianId: z
    .string()
    .uuid('Identificador do técnico inválido (UUID v4 esperado)')
    .optional()
    .nullable(),
  equipment: z
    .string()
    .trim()
    .min(2, 'Identificação do equipamento deve ter no mínimo 2 caracteres')
    .max(100, 'Identificação do equipamento deve ter no máximo 100 caracteres'),
  serialNumber: z
    .string()
    .trim()
    .max(100, 'Número de série deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  reportedDefect: z
    .string()
    .trim()
    .min(3, 'Defeito relatado deve ter no mínimo 3 caracteres')
    .max(1000, 'Defeito relatado deve ter no máximo 1000 caracteres'),
  technicalDiagnosis: z
    .string()
    .trim()
    .max(2000, 'Diagnóstico técnico deve ter no máximo 2000 caracteres')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Observações devem ter no máximo 2000 caracteres')
    .optional()
    .nullable(),
  discount: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .default(0),
  validUntil: z
    .string()
    .datetime('Data de validade deve estar no formato ISO 8601 (ex.: 2026-10-31T23:59:59Z)')
    .optional()
    .nullable(),
  items: z
    .array(createQuoteItemSchema)
    .min(1, 'O orçamento deve conter pelo menos 1 item (serviço ou peça)'),
});

// ─── Atualização de Orçamento (em DRAFT) ────────────────────────────────────

export const updateQuoteSchema = z.object({
  customerId: z
    .string()
    .uuid('Identificador do cliente inválido (UUID v4 esperado)')
    .optional(),
  technicianId: z
    .string()
    .uuid('Identificador do técnico inválido (UUID v4 esperado)')
    .optional()
    .nullable(),
  equipment: z
    .string()
    .trim()
    .min(2, 'Identificação do equipamento deve ter no mínimo 2 caracteres')
    .max(100, 'Identificação do equipamento deve ter no máximo 100 caracteres')
    .optional(),
  serialNumber: z
    .string()
    .trim()
    .max(100, 'Número de série deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  reportedDefect: z
    .string()
    .trim()
    .min(3, 'Defeito relatado deve ter no mínimo 3 caracteres')
    .max(1000, 'Defeito relatado deve ter no máximo 1000 caracteres')
    .optional(),
  technicalDiagnosis: z
    .string()
    .trim()
    .max(2000, 'Diagnóstico técnico deve ter no máximo 2000 caracteres')
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Observações devem ter no máximo 2000 caracteres')
    .optional()
    .nullable(),
  discount: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .optional(),
  validUntil: z
    .string()
    .datetime('Data de validade deve estar no formato ISO 8601')
    .optional()
    .nullable(),
  items: z
    .array(createQuoteItemSchema)
    .min(1, 'O orçamento deve conter pelo menos 1 item (serviço ou peça)')
    .optional(),
});

// ─── Atualização de Status ──────────────────────────────────────────────────

export const updateQuoteStatusSchema = z.object({
  status: quoteStatusEnum,
  notes: z
    .string()
    .trim()
    .max(1000, 'Observação sobre a mudança de status não pode exceder 1000 caracteres')
    .optional()
    .nullable(),
});

// ─── Parâmetros e Filtros ───────────────────────────────────────────────────

export const quoteIdParamSchema = z.object({
  id: z
    .string()
    .uuid('Identificador do orçamento inválido (UUID v4 esperado)'),
});

export const listQuotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'all'])
    .optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type CreateQuoteItemInput = z.infer<typeof createQuoteItemSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
export type ListQuotesQuery = z.infer<typeof listQuotesQuerySchema>;
export type QuoteIdParam = z.infer<typeof quoteIdParamSchema>;

// ─── Swagger / OpenAPI Schemas ──────────────────────────────────────────────
// NOTA: Omitimos response schemas para compatibilidade com Bun e fast-json-stringify.

export const createQuoteSwaggerSchema = {
  tags: ['Quotes'],
  summary: 'Criar novo Orçamento',
  description: 'Cadastra uma nova cotação de serviços e peças em status inicial DRAFT com geração automática de protocolo ORC-YYYY-XXXX.',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object' as const,
    required: ['customerId', 'equipment', 'reportedDefect', 'items'],
    properties: {
      customerId: { type: 'string' as const, format: 'uuid' },
      technicianId: { type: 'string' as const, format: 'uuid', nullable: true },
      equipment: { type: 'string' as const },
      serialNumber: { type: 'string' as const, nullable: true },
      reportedDefect: { type: 'string' as const },
      technicalDiagnosis: { type: 'string' as const, nullable: true },
      notes: { type: 'string' as const, nullable: true },
      discount: { type: 'number' as const, minimum: 0, default: 0 },
      validUntil: { type: 'string' as const, format: 'date-time', nullable: true },
      items: {
        type: 'array' as const,
        minItems: 1,
        items: {
          type: 'object' as const,
          required: ['type', 'description', 'quantity', 'unitPrice'],
          properties: {
            productId: { type: 'string' as const, format: 'uuid', nullable: true },
            type: { type: 'string' as const, enum: ['SERVICE', 'PART'] },
            description: { type: 'string' as const },
            quantity: { type: 'integer' as const, minimum: 1, default: 1 },
            unitPrice: { type: 'number' as const, minimum: 0 },
          },
        },
      },
    },
  },
};

export const listQuotesSwaggerSchema = {
  tags: ['Quotes'],
  summary: 'Listar Orçamentos com filtros e paginação',
  description: 'Retorna a lista paginada de orçamentos com suporte a busca textual por cliente, protocolo ou equipamento, e filtros por status ou cliente.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object' as const,
    properties: {
      page: { type: 'integer' as const, minimum: 1, default: 1 },
      limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 10 },
      search: { type: 'string' as const },
      status: { type: 'string' as const, enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'all'] },
      customerId: { type: 'string' as const, format: 'uuid' },
      startDate: { type: 'string' as const, format: 'date-time' },
      endDate: { type: 'string' as const, format: 'date-time' },
    },
  },
};

export const getQuoteSwaggerSchema = {
  tags: ['Quotes'],
  summary: 'Buscar Orçamento por ID',
  description: 'Retorna os detalhes completos de um orçamento com itens, dados do cliente, técnico e eventual Ordem de Serviço convertida.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
    },
  },
};

export const updateQuoteSwaggerSchema = {
  tags: ['Quotes'],
  summary: 'Atualizar Orçamento em Rascunho (DRAFT)',
  description: 'Permite editar dados e itens de um orçamento enquanto estiver em status DRAFT. Orçamentos enviados ou finalizados não podem ser alterados.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
    },
  },
  body: {
    type: 'object' as const,
    properties: {
      customerId: { type: 'string' as const, format: 'uuid' },
      technicianId: { type: 'string' as const, format: 'uuid', nullable: true },
      equipment: { type: 'string' as const },
      serialNumber: { type: 'string' as const, nullable: true },
      reportedDefect: { type: 'string' as const },
      technicalDiagnosis: { type: 'string' as const, nullable: true },
      notes: { type: 'string' as const, nullable: true },
      discount: { type: 'number' as const, minimum: 0 },
      validUntil: { type: 'string' as const, format: 'date-time', nullable: true },
      items: {
        type: 'array' as const,
        minItems: 1,
        items: {
          type: 'object' as const,
          required: ['type', 'description', 'quantity', 'unitPrice'],
          properties: {
            productId: { type: 'string' as const, format: 'uuid', nullable: true },
            type: { type: 'string' as const, enum: ['SERVICE', 'PART'] },
            description: { type: 'string' as const },
            quantity: { type: 'integer' as const, minimum: 1, default: 1 },
            unitPrice: { type: 'number' as const, minimum: 0 },
          },
        },
      },
    },
  },
};

export const updateQuoteStatusSwaggerSchema = {
  tags: ['Quotes'],
  summary: 'Atualizar Status do Orçamento',
  description: 'Altera o status do orçamento seguindo a máquina de estados (ex.: DRAFT -> SENT, SENT -> APPROVED / REJECTED / EXPIRED).',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
    },
  },
  body: {
    type: 'object' as const,
    required: ['status'],
    properties: {
      status: { type: 'string' as const, enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'] },
      notes: { type: 'string' as const, nullable: true },
    },
  },
};

export const convertToWorkOrderSwaggerSchema = {
  tags: ['Quotes'],
  summary: 'Converter Orçamento em Ordem de Serviço',
  description: 'Operação transacional que cria uma nova Ordem de Serviço a partir do orçamento, deduz o estoque de peças cadastradas, registra movimentações OUT, vincula a OS gerada ao orçamento e marca o orçamento como APPROVED.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
    },
  },
};
