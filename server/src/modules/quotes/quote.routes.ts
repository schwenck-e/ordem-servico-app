import { FastifyPluginAsync } from 'fastify';
import {
  createQuoteSchema,
  updateQuoteSchema,
  updateQuoteStatusSchema,
  quoteIdParamSchema,
  listQuotesQuerySchema,
  createQuoteSwaggerSchema,
  listQuotesSwaggerSchema,
  getQuoteSwaggerSchema,
  updateQuoteSwaggerSchema,
  updateQuoteStatusSwaggerSchema,
  convertToWorkOrderSwaggerSchema,
} from './quote.schemas';
import * as quoteService from './quote.service';

export const quoteRoutes: FastifyPluginAsync = async (app) => {
  // POST / — Criar novo Orçamento
  app.post('/', {
    schema: createQuoteSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const data = createQuoteSchema.parse(request.body);
    const quote = await quoteService.createQuote(app.prisma, data);
    return reply.status(201).send(quote);
  });

  // GET / — Listar Orçamentos com filtros e paginação
  app.get('/', {
    schema: listQuotesSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const query = listQuotesQuerySchema.parse(request.query);
    const result = await quoteService.listQuotes(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /:id — Buscar Orçamento por ID
  app.get('/:id', {
    schema: getQuoteSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = quoteIdParamSchema.parse(request.params);
    const quote = await quoteService.getQuoteById(app.prisma, id);
    return reply.status(200).send(quote);
  });

  // PUT /:id — Atualizar dados e itens do Orçamento em status DRAFT
  app.put('/:id', {
    schema: updateQuoteSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = quoteIdParamSchema.parse(request.params);
    const data = updateQuoteSchema.parse(request.body);
    const quote = await quoteService.updateQuote(app.prisma, id, data);
    return reply.status(200).send(quote);
  });

  // PATCH /:id/status — Atualizar status do Orçamento
  app.patch('/:id/status', {
    schema: updateQuoteStatusSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = quoteIdParamSchema.parse(request.params);
    const data = updateQuoteStatusSchema.parse(request.body);
    const quote = await quoteService.updateQuoteStatus(app.prisma, id, data);
    return reply.status(200).send(quote);
  });

  // POST /:id/convert-to-work-order — Converter Orçamento em Ordem de Serviço
  app.post('/:id/convert-to-work-order', {
    schema: convertToWorkOrderSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = quoteIdParamSchema.parse(request.params);
    const createdBy = request.user?.name || request.user?.email || 'SYSTEM';
    const result = await quoteService.convertToWorkOrder(app.prisma, id, {
      userId: createdBy,
    });
    return reply.status(201).send(result);
  });
};
