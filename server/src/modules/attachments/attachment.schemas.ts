import { z } from 'zod';
import { FastifySchema } from 'fastify';

// ─── Enums de Domínio ───────────────────────────────────────────────────────

export const attachmentTypeEnum = z.enum([
  'BEFORE',
  'AFTER',
  'DOCUMENT',
]);

export type AttachmentType = z.infer<typeof attachmentTypeEnum>;

// ─── Schemas de Parâmetros e Query ──────────────────────────────────────────

export const attachmentParamsSchema = z.object({
  id: z
    .string()
    .uuid('Identificador da Ordem de Serviço inválido (UUID v4 esperado)'),
  attachmentId: z
    .string()
    .uuid('Identificador do anexo inválido (UUID v4 esperado)')
    .optional(),
});

export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;

export const listAttachmentsQuerySchema = z.object({
  type: attachmentTypeEnum.optional(),
});

export type ListAttachmentsQuery = z.infer<typeof listAttachmentsQuerySchema>;

// ─── Schemas de Resposta ────────────────────────────────────────────────────

export const attachmentResponseSchema = z.object({
  id: z.string().uuid(),
  workOrderId: z.string().uuid(),
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  url: z.string(),
  type: attachmentTypeEnum,
  uploadedBy: z.string(),
  createdAt: z.date().or(z.string()),
});

export type AttachmentResponse = z.infer<typeof attachmentResponseSchema>;

// ─── Documentação Swagger (OpenAPI 3.0) ──────────────────────────────────────

const attachmentItemSwagger = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'ID do anexo' },
    workOrderId: { type: 'string', format: 'uuid', description: 'ID da Ordem de Serviço' },
    fileName: { type: 'string', description: 'Nome gerado do arquivo no disco' },
    originalName: { type: 'string', description: 'Nome original do arquivo enviado' },
    mimeType: { type: 'string', description: 'Tipo MIME do arquivo (ex.: image/jpeg, application/pdf)' },
    size: { type: 'integer', description: 'Tamanho em bytes' },
    url: { type: 'string', description: 'URL pública relativa para acesso ao arquivo' },
    type: { type: 'string', enum: ['BEFORE', 'AFTER', 'DOCUMENT'], description: 'Categoria do anexo' },
    uploadedBy: { type: 'string', description: 'Nome ou identificador do usuário que enviou o arquivo' },
    createdAt: { type: 'string', format: 'date-time', description: 'Data/hora de upload' },
  },
  required: ['id', 'workOrderId', 'fileName', 'originalName', 'mimeType', 'size', 'url', 'type', 'uploadedBy', 'createdAt'],
};

const errorSwaggerResponse = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

export const uploadAttachmentSwaggerSchema: FastifySchema = {
  tags: ['WorkOrders', 'Attachments'],
  summary: 'Upload de foto ou documento da Ordem de Serviço',
  description: 'Recebe um arquivo via multipart/form-data (JPEG, PNG, WebP ou PDF de até 10MB) associado à OS.',
  security: [{ bearerAuth: [] }],
  consumes: ['multipart/form-data'],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'ID da Ordem de Serviço' },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary', description: 'Arquivo físico (foto ou documento)' },
      type: {
        type: 'string',
        enum: ['BEFORE', 'AFTER', 'DOCUMENT'],
        default: 'DOCUMENT',
        description: 'Categoria do anexo (BEFORE: antes do reparo, AFTER: após o reparo, DOCUMENT: laudos/notas)',
      },
    },
    required: ['file'],
  },
  response: {
    201: {
      description: 'Anexo enviado e registrado com sucesso',
      ...attachmentItemSwagger,
    },
    400: {
      description: 'Requisição inválida (arquivo ausente, tipo não permitido ou limite excedido)',
      ...errorSwaggerResponse,
    },
    401: {
      description: 'Não autenticado (token ausente ou inválido)',
      ...errorSwaggerResponse,
    },
    404: {
      description: 'Ordem de Serviço não encontrada',
      ...errorSwaggerResponse,
    },
    500: {
      description: 'Erro interno no processamento do arquivo',
      ...errorSwaggerResponse,
    },
  },
};

export const listAttachmentsSwaggerSchema: FastifySchema = {
  tags: ['WorkOrders', 'Attachments'],
  summary: 'Listar fotos e anexos da Ordem de Serviço',
  description: 'Retorna todos os anexos associados à OS indicada, com suporte a filtro por tipo (BEFORE, AFTER, DOCUMENT).',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'ID da Ordem de Serviço' },
    },
    required: ['id'],
  },
  querystring: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['BEFORE', 'AFTER', 'DOCUMENT'],
        description: 'Filtro opcional pela categoria do anexo',
      },
    },
  },
  response: {
    200: {
      description: 'Lista de anexos retornada com sucesso',
      type: 'array',
      items: attachmentItemSwagger,
    },
    401: {
      description: 'Não autenticado (token ausente ou inválido)',
      ...errorSwaggerResponse,
    },
    404: {
      description: 'Ordem de Serviço não encontrada',
      ...errorSwaggerResponse,
    },
  },
};

export const deleteAttachmentSwaggerSchema: FastifySchema = {
  tags: ['WorkOrders', 'Attachments'],
  summary: 'Excluir foto ou anexo da Ordem de Serviço',
  description: 'Exclui o registro do anexo e o arquivo físico correspondente. Permitido apenas para ADMIN ou para o usuário autor do upload.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'ID da Ordem de Serviço' },
      attachmentId: { type: 'string', format: 'uuid', description: 'ID do anexo' },
    },
    required: ['id', 'attachmentId'],
  },
  response: {
    200: {
      description: 'Anexo removido com sucesso',
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Anexo excluído com sucesso.' },
      },
    },
    401: {
      description: 'Não autenticado',
      ...errorSwaggerResponse,
    },
    403: {
      description: 'Acesso negado (usuário não possui permissão para excluir este anexo)',
      ...errorSwaggerResponse,
    },
    404: {
      description: 'Ordem de Serviço ou anexo não encontrado',
      ...errorSwaggerResponse,
    },
  },
};
