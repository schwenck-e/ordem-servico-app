import { FastifyPluginAsync } from 'fastify';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  updateWorkOrderStatusSchema,
  workOrderIdParamSchema,
  listWorkOrdersQuerySchema,
  createWorkOrderSwaggerSchema,
  listWorkOrdersSwaggerSchema,
  getWorkOrderSwaggerSchema,
  updateWorkOrderSwaggerSchema,
  updateWorkOrderStatusSwaggerSchema,
  getWorkOrderTimelineSwaggerSchema,
} from './work-order.schemas';
import * as workOrderService from './work-order.service';

export const workOrderRoutes: FastifyPluginAsync = async (app) => {
  // POST / — Criar nova Ordem de Serviço
  app.post('/', {
    schema: createWorkOrderSwaggerSchema,
  }, async (request, reply) => {
    const data = createWorkOrderSchema.parse(request.body);
    const workOrder = await workOrderService.createWorkOrder(app.prisma, data);
    return reply.status(201).send(workOrder);
  });

  // GET / — Listar Ordens de Serviço (paginado, filtros e busca)
  app.get('/', {
    schema: listWorkOrdersSwaggerSchema,
  }, async (request, reply) => {
    const query = listWorkOrdersQuerySchema.parse(request.query);
    const result = await workOrderService.listWorkOrders(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /:id — Buscar Ordem de Serviço por UUID
  app.get('/:id', {
    schema: getWorkOrderSwaggerSchema,
  }, async (request, reply) => {
    const { id } = workOrderIdParamSchema.parse(request.params);
    const workOrder = await workOrderService.getWorkOrderById(app.prisma, id);
    return reply.status(200).send(workOrder);
  });

  // PUT /:id — Atualizar dados e itens da Ordem de Serviço
  app.put('/:id', {
    schema: updateWorkOrderSwaggerSchema,
  }, async (request, reply) => {
    const { id } = workOrderIdParamSchema.parse(request.params);
    const data = updateWorkOrderSchema.parse(request.body);
    const workOrder = await workOrderService.updateWorkOrder(app.prisma, id, data);
    return reply.status(200).send(workOrder);
  });

  // PATCH /:id/status — Alterar status da Ordem de Serviço com validação de fluxo e auditoria
  app.patch('/:id/status', {
    schema: updateWorkOrderStatusSwaggerSchema,
  }, async (request, reply) => {
    const { id } = workOrderIdParamSchema.parse(request.params);
    const data = updateWorkOrderStatusSchema.parse(request.body);
    const workOrder = await workOrderService.updateWorkOrderStatus(app.prisma, id, data);
    return reply.status(200).send(workOrder);
  });

  // GET /:id/timeline — Consultar linha do tempo / histórico de auditoria da Ordem de Serviço
  app.get('/:id/timeline', {
    schema: getWorkOrderTimelineSwaggerSchema,
  }, async (request, reply) => {
    const { id } = workOrderIdParamSchema.parse(request.params);
    const timeline = await workOrderService.getWorkOrderTimeline(app.prisma, id);
    return reply.status(200).send(timeline);
  });
};

