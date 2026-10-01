import { z } from 'zod';

// ─── Zod Validation Schemas ─────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.'),
  role: z.enum(['ADMIN', 'OPERATOR']).optional().default('OPERATOR')
});

// ─── Swagger / OpenAPI Schemas ───────────────────────────────────────────────

export const loginSwaggerSchema = {
  tags: ['Auth'],
  summary: 'Autenticar usuário e obter token JWT',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', description: 'E-mail do usuário' },
      password: { type: 'string', minLength: 6, description: 'Senha do usuário' }
    }
  },
  response: {
    200: {
      description: 'Login realizado com sucesso',
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        }
      }
    },
    400: { description: 'Dados inválidos', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    401: { description: 'Credenciais inválidas', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    403: { description: 'Conta desativada', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } }
  }
};

export const getMeSwaggerSchema = {
  tags: ['Auth'],
  summary: 'Obter perfil do usuário autenticado',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Perfil do usuário autenticado',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' }
      }
    },
    401: { description: 'Não autenticado', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } }
  }
};

export const registerSwaggerSchema = {
  tags: ['Auth'],
  summary: 'Registrar novo usuário (primeiro admin ou colaborador via ADMIN)',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['ADMIN', 'OPERATOR'] }
    }
  },
  response: {
    201: {
      description: 'Usuário criado com sucesso',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string' }
      }
    },
    400: { description: 'Dados inválidos', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    401: { description: 'Não autenticado', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    403: { description: 'Sem permissão', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } },
    409: { description: 'E-mail já cadastrado', type: 'object', properties: { statusCode: { type: 'number' }, error: { type: 'string' }, message: { type: 'string' } } }
  }
};

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
