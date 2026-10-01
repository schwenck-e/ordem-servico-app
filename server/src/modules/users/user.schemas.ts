import { z } from 'zod';

// ─── Zod Validation Schemas ─────────────────────────────────────────────────

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional()
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido.')
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.'),
  role: z.enum(['ADMIN', 'OPERATOR']).optional().default('OPERATOR'),
  isActive: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.').optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  isActive: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Ao menos um campo deve ser informado para atualização.'
});

// ─── Swagger / OpenAPI Schemas ───────────────────────────────────────────────

const userResponseProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  email: { type: 'string' },
  role: { type: 'string' },
  isActive: { type: 'boolean' },
  createdAt: { type: 'string' },
  updatedAt: { type: 'string' }
};

const unauthorizedResponse = {
  description: 'Não autenticado',
  type: 'object',
  properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } }
};

const forbiddenResponse = {
  description: 'Sem permissão',
  type: 'object',
  properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } }
};

const notFoundResponse = {
  description: 'Usuário não encontrado',
  type: 'object',
  properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } }
};

export const listUsersSwaggerSchema = {
  tags: ['Users'],
  summary: 'Listar usuários (paginado) — ADMIN',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 1 },
      limit: { type: 'number', default: 10 },
      search: { type: 'string' },
      role: { type: 'string', enum: ['ADMIN', 'OPERATOR'] },
      isActive: { type: 'string', enum: ['true', 'false'] }
    }
  },
  response: {
    200: {
      description: 'Lista paginada de usuários',
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object', properties: userResponseProperties } },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    },
    401: unauthorizedResponse,
    403: forbiddenResponse
  }
};

export const getUserSwaggerSchema = {
  tags: ['Users'],
  summary: 'Buscar usuário por UUID — ADMIN ou próprio usuário',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  response: {
    200: { description: 'Usuário encontrado', type: 'object', properties: userResponseProperties },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse
  }
};

export const createUserSwaggerSchema = {
  tags: ['Users'],
  summary: 'Criar novo colaborador — ADMIN',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['ADMIN', 'OPERATOR'] },
      isActive: { type: 'boolean' }
    }
  },
  response: {
    201: { description: 'Usuário criado', type: 'object', properties: userResponseProperties },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    409: { description: 'E-mail já em uso', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } }
  }
};

export const updateUserSwaggerSchema = {
  tags: ['Users'],
  summary: 'Atualizar dados do usuário — ADMIN',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['ADMIN', 'OPERATOR'] },
      isActive: { type: 'boolean' }
    }
  },
  response: {
    200: { description: 'Usuário atualizado', type: 'object', properties: userResponseProperties },
    400: { description: 'Dados inválidos', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse
  }
};

export const deleteUserSwaggerSchema = {
  tags: ['Users'],
  summary: 'Remover ou desativar usuário — ADMIN',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } }
  },
  response: {
    204: { description: 'Usuário removido com sucesso', type: 'null' },
    400: { description: 'Operação inválida (auto-exclusão)', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse
  }
};

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
