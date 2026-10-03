import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, 'SKU deve ter no mínimo 2 caracteres')
    .max(50, 'SKU deve ter no máximo 50 caracteres')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  unit: z
    .string()
    .trim()
    .min(1, 'Unidade não pode ser vazia')
    .max(10, 'Unidade deve ter no máximo 10 caracteres')
    .default('UN'),
  costPrice: z
    .number()
    .min(0, 'Preço de custo não pode ser negativo')
    .default(0),
  salePrice: z
    .number()
    .min(0, 'Preço de venda não pode ser negativo')
    .default(0),
  initialStock: z
    .number()
    .int('Estoque inicial deve ser um número inteiro')
    .min(0, 'Estoque inicial não pode ser negativo')
    .default(0),
  minStock: z
    .number()
    .int('Estoque mínimo deve ser um número inteiro')
    .min(0, 'Estoque mínimo não pode ser negativo')
    .default(0),
});

export const updateProductSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(2, 'SKU deve ter no mínimo 2 caracteres')
      .max(50, 'SKU deve ter no máximo 50 caracteres')
      .transform((val) => val.toUpperCase())
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(150, 'Nome deve ter no máximo 150 caracteres')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional()
      .nullable(),
    unit: z
      .string()
      .trim()
      .min(1, 'Unidade não pode ser vazia')
      .max(10, 'Unidade deve ter no máximo 10 caracteres')
      .optional(),
    costPrice: z
      .number()
      .min(0, 'Preço de custo não pode ser negativo')
      .optional(),
    salePrice: z
      .number()
      .min(0, 'Preço de venda não pode ser negativo')
      .optional(),
    minStock: z
      .number()
      .int('Estoque mínimo deve ser um número inteiro')
      .min(0, 'Estoque mínimo não pode ser negativo')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Ao menos um campo deve ser informado para atualização'
  );

export const productIdParamSchema = z.object({
  id: z.string().uuid('Identificador inválido (UUID v4 esperado)'),
});

export const listProductsQuerySchema = z.object({
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
  search: z.string().trim().optional(),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

// ─── Swagger / OpenAPI Schemas ──────────────────────────────────────────────
// Sem esquemas de resposta para prevenir conflitos de serialização com fast-json-stringify

export const createProductSwaggerSchema = {
  tags: ['Products'],
  summary: 'Cadastrar novo produto / peça',
  description: 'Cadastra um novo produto no catálogo de estoque com validação de SKU único e geração opcional de movimentação de saldo inicial.',
  security: [{ bearerAuth: [] }],
};

export const listProductsSwaggerSchema = {
  tags: ['Products'],
  summary: 'Listar produtos cadastrados',
  description: 'Retorna a listagem paginada de produtos com suporte a busca textual por nome e código SKU.',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, minimum: 1 },
      limit: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
      search: { type: 'string', description: 'Busca por SKU ou nome do produto' },
    },
  },
};

export const getLowStockProductsSwaggerSchema = {
  tags: ['Products'],
  summary: 'Consultar produtos com estoque baixo ou crítico',
  description: 'Retorna produtos cujo estoque atual (currentStock) é menor ou igual ao estoque mínimo (minStock).',
  security: [{ bearerAuth: [] }],
};

export const getProductSwaggerSchema = {
  tags: ['Products'],
  summary: 'Buscar produto por ID',
  description: 'Retorna os detalhes do produto, incluindo histórico recente de movimentações e contagem de itens em ordens de serviço.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

export const updateProductSwaggerSchema = {
  tags: ['Products'],
  summary: 'Atualizar dados cadastrais do produto',
  description: 'Permite atualizar preços, SKU, unidade e limites de estoque (o saldo atual é alterado exclusivamente por movimentações).',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};

export const deleteProductSwaggerSchema = {
  tags: ['Products'],
  summary: 'Excluir produto (ADMIN apenas)',
  description: 'Exclui um produto do catálogo. Bloqueado com 409 se houver histórico de movimentações de estoque ou vínculos com ordens de serviço.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },
};
