import { z } from 'zod';

// ─── Enums de Domínio ───────────────────────────────────────────────────────

export const workOrderStatusEnum = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'WAITING_APPROVAL',
  'COMPLETED',
  'CANCELED',
]);

export const workOrderPriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const workOrderItemTypeEnum = z.enum([
  'SERVICE',
  'PART',
]);

// ─── Itens da Ordem de Serviço ──────────────────────────────────────────────

export const createWorkOrderItemSchema = z.object({
  type: workOrderItemTypeEnum,
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

// ─── Criação de Ordem de Serviço ────────────────────────────────────────────

export const createWorkOrderSchema = z.object({
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
    .min(2, 'Equipamento deve ter no mínimo 2 caracteres')
    .max(150, 'Equipamento deve ter no máximo 150 caracteres'),
  serialNumber: z
    .string()
    .trim()
    .max(100, 'Número de série deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  reportedDefect: z
    .string()
    .trim()
    .min(5, 'Defeito relatado deve ter no mínimo 5 caracteres')
    .max(1000, 'Defeito relatado deve ter no máximo 1000 caracteres'),
  priority: workOrderPriorityEnum
    .default('MEDIUM')
    .optional(),
  scheduledDate: z
    .coerce
    .date()
    .optional()
    .nullable(),
  discount: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .default(0)
    .optional(),
  items: z
    .array(createWorkOrderItemSchema)
    .min(1, 'A ordem de serviço deve conter ao menos um item'),
  initialComment: z
    .string()
    .trim()
    .max(500, 'Comentário inicial deve ter no máximo 500 caracteres')
    .optional(),
});

// ─── Atualização de Ordem de Serviço ────────────────────────────────────────

export const updateWorkOrderSchema = z.object({
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
    .min(2, 'Equipamento deve ter no mínimo 2 caracteres')
    .max(150, 'Equipamento deve ter no máximo 150 caracteres')
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
    .min(5, 'Defeito relatado deve ter no mínimo 5 caracteres')
    .max(1000, 'Defeito relatado deve ter no máximo 1000 caracteres')
    .optional(),
  technicalDiagnosis: z
    .string()
    .trim()
    .max(2000, 'Diagnóstico técnico deve ter no máximo 2000 caracteres')
    .optional()
    .nullable(),
  priority: workOrderPriorityEnum
    .optional(),
  scheduledDate: z
    .coerce
    .date()
    .optional()
    .nullable(),
  discount: z
    .number()
    .min(0, 'Desconto não pode ser negativo')
    .optional(),
  items: z
    .array(createWorkOrderItemSchema)
    .min(1, 'A lista de itens não pode ser vazia')
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'Ao menos um campo deve ser informado para atualização'
);

// ─── Parâmetros de Rota e Consulta ──────────────────────────────────────────

export const workOrderIdParamSchema = z.object({
  id: z.string().uuid('Identificador inválido (UUID v4 esperado)'),
});

export const listWorkOrdersQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página mínima é 1')
    .default(1),
  limit: z.coerce
    .number()
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite mínimo é 1')
    .max(100, 'Limite máximo é 100')
    .default(10),
  search: z.string().trim().optional(),
  status: z
    .union([workOrderStatusEnum, z.literal('all')])
    .optional(),
  priority: z
    .union([workOrderPriorityEnum, z.literal('all')])
    .optional(),
  customerId: z
    .string()
    .uuid('Identificador do cliente deve ser um UUID v4 válido')
    .optional(),
  technicianId: z
    .string()
    .trim()
    .optional(),
  startDate: z
    .coerce
    .date()
    .optional(),
  endDate: z
    .coerce
    .date()
    .optional(),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type CreateWorkOrderItemInput = z.infer<typeof createWorkOrderItemSchema>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type ListWorkOrdersQuery = z.infer<typeof listWorkOrdersQuerySchema>;
export type WorkOrderIdParam = z.infer<typeof workOrderIdParamSchema>;

// ─── Swagger / OpenAPI Schemas ──────────────────────────────────────────────
// NOTA: Conforme estabelecido no projeto, omitimos response schemas
// para total compatibilidade com Bun e fast-json-stringify.

export const createWorkOrderSwaggerSchema = {
  tags: ['WorkOrders'],
  summary: 'Criar nova Ordem de Serviço',
  description: 'Cadastra uma nova Ordem de Serviço com itens (serviços e peças), geração atômica de protocolo sequencial e log inicial.',
  body: {
    type: 'object' as const,
    required: ['customerId', 'equipment', 'reportedDefect', 'items'],
    properties: {
      customerId: { type: 'string' as const, format: 'uuid' },
      technicianId: { type: 'string' as const, format: 'uuid', nullable: true },
      equipment: { type: 'string' as const },
      serialNumber: { type: 'string' as const, nullable: true },
      reportedDefect: { type: 'string' as const },
      priority: { type: 'string' as const, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
      scheduledDate: { type: 'string' as const, format: 'date-time', nullable: true },
      discount: { type: 'number' as const, minimum: 0, default: 0 },
      initialComment: { type: 'string' as const },
      items: {
        type: 'array' as const,
        minItems: 1,
        items: {
          type: 'object' as const,
          required: ['type', 'description', 'quantity', 'unitPrice'],
          properties: {
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

export const listWorkOrdersSwaggerSchema = {
  tags: ['WorkOrders'],
  summary: 'Listar Ordens de Serviço com filtros e paginação',
  description: 'Retorna a lista paginada de Ordens de Serviço com suporte a busca textual e filtros operacionais por status, prioridade, cliente, técnico e datas.',
  querystring: {
    type: 'object' as const,
    properties: {
      page: { type: 'integer' as const, minimum: 1, default: 1 },
      limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 10 },
      search: { type: 'string' as const },
      status: { type: 'string' as const, enum: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELED', 'all'] },
      priority: { type: 'string' as const, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'all'] },
      customerId: { type: 'string' as const, format: 'uuid' },
      technicianId: { type: 'string' as const },
      startDate: { type: 'string' as const, format: 'date-time' },
      endDate: { type: 'string' as const, format: 'date-time' },
    },
  },
};

export const getWorkOrderSwaggerSchema = {
  tags: ['WorkOrders'],
  summary: 'Buscar Ordem de Serviço por ID',
  description: 'Retorna os detalhes completos de uma Ordem de Serviço incluindo cliente, técnico, itens e histórico cronológico de logs.',
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
    },
  },
};

export const updateWorkOrderSwaggerSchema = {
  tags: ['WorkOrders'],
  summary: 'Atualizar Ordem de Serviço e Itens',
  description: 'Atualiza dados cadastrais e permite a substituição atômica de itens com recálculo automático de subtotais e valor total.',
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
      priority: { type: 'string' as const, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      scheduledDate: { type: 'string' as const, format: 'date-time', nullable: true },
      discount: { type: 'number' as const, minimum: 0 },
      items: {
        type: 'array' as const,
        minItems: 1,
        items: {
          type: 'object' as const,
          required: ['type', 'description', 'quantity', 'unitPrice'],
          properties: {
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
