import { FastifyPluginAsync } from 'fastify';
import {
  createStockMovementSchema,
  listStockMovementsQuerySchema,
  createStockMovementSwaggerSchema,
  listStockMovementsSwaggerSchema,
} from './stock.schemas';
import * as stockService from './stock.service';

export const stockRoutes: FastifyPluginAsync = async (app) => {
  // POST /movements — Registrar movimentação de estoque
  app.post('/movements', {
    schema: createStockMovementSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const data = createStockMovementSchema.parse(request.body);
    const movement = await stockService.createStockMovement(
      app.prisma,
      data,
      request.user.name || request.user.email
    );
    return reply.status(201).send(movement);
  });

  // GET /movements — Listar histórico auditável de movimentações
  app.get('/movements', {
    schema: listStockMovementsSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const query = listStockMovementsQuerySchema.parse(request.query);
    const result = await stockService.listStockMovements(app.prisma, query);
    return reply.status(200).send(result);
  });
};
