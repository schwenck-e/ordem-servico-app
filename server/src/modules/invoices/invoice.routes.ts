import { FastifyPluginAsync } from 'fastify';
import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  invoiceIdParamSchema,
  cancelInvoiceSchema,
  createPaymentSchema,
  createInvoiceSwaggerSchema,
  listInvoicesSwaggerSchema,
  getInvoiceSwaggerSchema,
  cancelInvoiceSwaggerSchema,
  createPaymentSwaggerSchema,
} from './invoice.schemas';
import * as invoiceService from './invoice.service';
import * as paymentService from '../payments/payment.service';

export const invoiceRoutes: FastifyPluginAsync = async (app) => {
  // POST / — Criar nova Fatura
  app.post('/', {
    schema: createInvoiceSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const data = createInvoiceSchema.parse(request.body);
    const invoice = await invoiceService.createInvoice(app.prisma, data);
    return reply.status(201).send(invoice);
  });

  // GET / — Listar Faturas com filtros e paginação
  app.get('/', {
    schema: listInvoicesSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const query = listInvoicesQuerySchema.parse(request.query);
    const result = await invoiceService.listInvoices(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /:id — Buscar Fatura por ID
  app.get('/:id', {
    schema: getInvoiceSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = invoiceIdParamSchema.parse(request.params);
    const invoice = await invoiceService.getInvoiceById(app.prisma, id);
    return reply.status(200).send(invoice);
  });

  // PATCH /:id/cancel — Cancelar Fatura pendente
  app.patch('/:id/cancel', {
    schema: cancelInvoiceSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = invoiceIdParamSchema.parse(request.params);
    const data = cancelInvoiceSchema.parse(request.body || {});
    const invoice = await invoiceService.cancelInvoice(app.prisma, id, data);
    return reply.status(200).send(invoice);
  });

  // POST /:id/payments — Registrar pagamento para a fatura
  app.post('/:id/payments', {
    schema: createPaymentSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = invoiceIdParamSchema.parse(request.params);
    const data = createPaymentSchema.parse(request.body);
    const receivedBy = request.user?.name || request.user?.email || 'SYSTEM';

    const result = await paymentService.createPayment(
      app.prisma,
      id,
      data,
      receivedBy
    );
    return reply.status(201).send(result);
  });
};
