import { z } from 'zod';

// ─── CPF Validation ─────────────────────────────────────────────────────────

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateCpf(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== 11) return false;

  // Reject sequences of identical digits (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10], 10)) return false;

  return true;
}

// ─── CNPJ Validation ────────────────────────────────────────────────────────

export function validateCnpj(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== 14) return false;

  // Reject sequences of identical digits
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // First check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(digits[12], 10)) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(digits[13], 10)) return false;

  return true;
}

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  document: z
    .string()
    .trim()
    .refine(
      (val) => validateCpf(val) || validateCnpj(val),
      'Documento deve ser um CPF ou CNPJ válido'
    ),
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
  address: z
    .string()
    .trim()
    .min(5, 'Endereço deve ter no mínimo 5 caracteres')
    .max(255, 'Endereço deve ter no máximo 255 caracteres'),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Ao menos um campo deve ser informado para atualização'
  );

export const customerIdParamSchema = z.object({
  id: z.string().uuid('Identificador inválido (UUID v4 esperado)'),
});

export const listCustomersQuerySchema = z.object({
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

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

// ─── Swagger / OpenAPI Route Schemas ────────────────────────────────────────
// NOTE: We deliberately omit `response` schemas to avoid compatibility issues
// between Bun's runtime, light-my-request, and Fastify's fast-json-stringify.
// The Swagger documentation still works via tags, summary, and description.
// All input validation is handled by Zod in the route handlers.

export const createCustomerSwaggerSchema = {
  tags: ['Customers'],
  summary: 'Cadastrar novo cliente',
  description: 'Cria um novo registro de cliente com validação de CPF/CNPJ, e-mail e telefone.',
  body: {
    type: 'object' as const,
    required: ['name', 'document', 'email', 'phone', 'address'],
    properties: {
      name: { type: 'string' as const },
      document: { type: 'string' as const },
      email: { type: 'string' as const },
      phone: { type: 'string' as const },
      address: { type: 'string' as const },
    },
  },
};

export const listCustomersSwaggerSchema = {
  tags: ['Customers'],
  summary: 'Listar clientes com paginação e busca',
  description: 'Retorna lista paginada de clientes com filtro textual opcional por nome, documento ou e-mail.',
  querystring: {
    type: 'object' as const,
    properties: {
      page: { type: 'integer' as const, minimum: 1, default: 1 },
      limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 10 },
      search: { type: 'string' as const },
    },
  },
};

export const getCustomerSwaggerSchema = {
  tags: ['Customers'],
  summary: 'Buscar cliente por ID',
  description: 'Retorna os dados detalhados de um cliente pelo UUID, incluindo contagem de ordens de serviço.',
  params: {
    type: 'object' as const,
    properties: {
      id: { type: 'string' as const },
    },
    required: ['id'],
  },
};

export const updateCustomerSwaggerSchema = {
  tags: ['Customers'],
  summary: 'Atualizar dados de cliente',
  description: 'Atualiza parcial ou totalmente os dados cadastrais de um cliente existente.',
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
      document: { type: 'string' as const },
      email: { type: 'string' as const },
      phone: { type: 'string' as const },
      address: { type: 'string' as const },
    },
  },
};

export const deleteCustomerSwaggerSchema = {
  tags: ['Customers'],
  summary: 'Excluir cliente',
  description: 'Remove um cliente caso não possua ordens de serviço vinculadas.',
  params: {
    type: 'object' as const,
    properties: {
      id: { type: 'string' as const },
    },
    required: ['id'],
  },
};
