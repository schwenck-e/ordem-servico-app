import { FastifyPluginAsync } from 'fastify';
import {
  attachmentParamsSchema,
  listAttachmentsQuerySchema,
  uploadAttachmentSwaggerSchema,
  listAttachmentsSwaggerSchema,
  deleteAttachmentSwaggerSchema,
} from './attachment.schemas';
import * as attachmentService from './attachment.service';

export const attachmentRoutes: FastifyPluginAsync = async (app) => {
  // POST /:id/attachments — Upload de foto ou documento para a Ordem de Serviço
  app.post('/:id/attachments', {
    schema: uploadAttachmentSwaggerSchema,
    validatorCompiler: () => () => true,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = attachmentParamsSchema.parse(request.params);
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Nenhum arquivo enviado.',
      });
    }

    const attachment = await attachmentService.uploadAttachment(
      app.prisma,
      id,
      data,
      request.user
    );

    return reply.status(201).send(attachment);
  });

  // GET /:id/attachments — Listar fotos e anexos da Ordem de Serviço
  app.get('/:id/attachments', {
    schema: listAttachmentsSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = attachmentParamsSchema.parse(request.params);
    const query = listAttachmentsQuerySchema.parse(request.query);
    const attachments = await attachmentService.listAttachments(
      app.prisma,
      id,
      query.type
    );

    return reply.status(200).send(attachments);
  });

  // DELETE /:id/attachments/:attachmentId — Remover anexo da Ordem de Serviço
  app.delete('/:id/attachments/:attachmentId', {
    schema: deleteAttachmentSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id, attachmentId } = attachmentParamsSchema.parse(request.params);
    if (!attachmentId) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Identificador do anexo é obrigatório.',
      });
    }

    const result = await attachmentService.deleteAttachment(
      app.prisma,
      id,
      attachmentId,
      request.user
    );

    return reply.status(200).send(result);
  });
};
