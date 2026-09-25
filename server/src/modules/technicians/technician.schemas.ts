import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const createTechnicianSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido'),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4}|\d{10,11})$/,
      'Telefone inválido'
    ),
  specialty: z
    .string()
    .trim()
    .min(2, 'Especialidade deve ter no mínimo 2 caracteres')
    .max(100, 'Especialidade deve ter no máximo 100 caracteres'),
  isActive: z.boolean().default(true).optional(),
});

export const updateTechnicianSchema = createTechnicianSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Ao menos um campo deve ser informado para atualização'
  );

export const technicianIdParamSchema = z.object({
  id: z.string().uuid('Identificador inválido (UUID v4 esperado)'),
});

export const listTechniciansQuerySchema = z.object({
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
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    ),
  specialty: z.string().trim().optional(),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;
export type ListTechniciansQuery = z.infer<typeof listTechniciansQuerySchema>;

// ─── Swagger / OpenAPI Route Schemas ────────────────────────────────────────
// NOTE: We deliberately omit `response` schemas to avoid compatibility issues
// between Bun's runtime, light-my-request, and Fastify's fast-json-stringify.
// The Swagger documentation still works via tags, summary, and description.
// All input validation is handled by Zod in the route handlers.

export const createTechnicianSwaggerSchema = {
  tags: ['Technicians'],
  summary: 'Cadastrar novo técnico',
  description:
    'Cria um novo registro de técnico com validação de e-mail, telefone e especialidade. Retorna 409 se o e-mail já estiver em uso.',
  body: {
    type: 'object' as const,
    required: ['name', 'email', 'phone', 'specialty'],
    properties: {
      name: { type: 'string' as const },
      email: { type: 'string' as const },
      phone: { type: 'string' as const },
      specialty: { type: 'string' as const },
      isActive: { type: 'boolean' as const },
    },
  },
};

export const listTechniciansSwaggerSchema = {
  tags: ['Technicians'],
  summary: 'Listar técnicos com paginação, busca e filtros',
  description:
    'Retorna lista paginada de técnicos com filtro textual opcional (nome, e-mail, especialidade, telefone) e filtros por status de atividade e especialidade.',
  querystring: {
    type: 'object' as const,
    properties: {
      page: { type: 'integer' as const, minimum: 1, default: 1 },
      limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 10 },
      search: { type: 'string' as const },
      isActive: { type: 'string' as const, enum: ['true', 'false', 'all'] },
      specialty: { type: 'string' as const },
    },
  },
};

export const getTechnicianSwaggerSchema = {
  tags: ['Technicians'],
  summary: 'Buscar técnico por ID',
  description:
    'Retorna os dados detalhados de um técnico pelo UUID, incluindo contagem de ordens de serviço associadas.',
  params: {
    type: 'object' as const,
    properties: {
      id: { type: 'string' as const },
    },
    required: ['id'],
  },
};

export const updateTechnicianSwaggerSchema = {
  tags: ['Technicians'],
  summary: 'Atualizar dados de técnico',
  description:
    'Atualiza parcial ou totalmente os dados cadastrais de um técnico existente. Retorna 409 se o novo e-mail já pertencer a outro técnico.',
  params: {
    type: 'object' as const,
    properties: {
      id: { type: 'string' as const },
    },
    required: ['id'],
  },
  body: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      email: { type: 'string' as const },
      phone: { type: 'string' as const },
      specialty: { type: 'string' as const },
      isActive: { type: 'boolean' as const },
    },
  },
};

export const deleteTechnicianSwaggerSchema = {
  tags: ['Technicians'],
  summary: 'Excluir técnico',
  description:
    'Remove um técnico caso não possua ordens de serviço ativas (OPEN, IN_PROGRESS, WAITING_PARTS, WAITING_APPROVAL) vinculadas.',
  params: {
    type: 'object' as const,
    properties: {
      id: { type: 'string' as const },
    },
    required: ['id'],
  },
};
