import { FastifyPluginAsync } from 'fastify';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionIdParamSchema,
  payTransactionSchema,
  cashflowQuerySchema,
  createTransactionSwaggerSchema,
  listTransactionsSwaggerSchema,
  payTransactionSwaggerSchema,
  getCashflowSwaggerSchema,
} from './financial.schemas';
import * as financialService from './financial.service';

export const financialRoutes: FastifyPluginAsync = async (app) => {
  // ─── GET /cashflow — Resumo e Fluxo de Caixa ───────────────────────────────
  app.get(
    '/cashflow',
    {
      schema: getCashflowSwaggerSchema,
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const query = cashflowQuerySchema.parse(request.query);
      const result = await financialService.getCashflow(app.prisma, query);
      return reply.status(200).send(result);
    }
  );

  // ─── GET / e /transactions — Listar Transações ─────────────────────────────
  const listHandler = async (request: any, reply: any) => {
    const query = listTransactionsQuerySchema.parse(request.query);
    const result = await financialService.listTransactions(app.prisma, query);
    return reply.status(200).send(result);
  };

  app.get(
    '/',
    {
      schema: listTransactionsSwaggerSchema,
      preHandler: [app.authenticate],
    },
    listHandler
  );

  app.get(
    '/transactions',
    {
      schema: listTransactionsSwaggerSchema,
      preHandler: [app.authenticate],
    },
    listHandler
  );

  // ─── POST / e /transactions — Criar Transação Avulsa (ADMIN) ───────────────
  const createHandler = async (request: any, reply: any) => {
    const data = createTransactionSchema.parse(request.body);
    const transaction = await financialService.createTransaction(app.prisma, data);
    return reply.status(201).send(transaction);
  };

  app.post(
    '/',
    {
      schema: createTransactionSwaggerSchema,
      preHandler: [app.authenticate, app.requireRole(['ADMIN'])],
    },
    createHandler
  );

  app.post(
    '/transactions',
    {
      schema: createTransactionSwaggerSchema,
      preHandler: [app.authenticate, app.requireRole(['ADMIN'])],
    },
    createHandler
  );

  // ─── PATCH /:id/pay e /transactions/:id/pay — Baixar / Liquidar Transação ───
  const payHandler = async (request: any, reply: any) => {
    const { id } = transactionIdParamSchema.parse(request.params);
    const data = payTransactionSchema.parse(request.body || {});
    const updated = await financialService.payTransaction(app.prisma, id, data);
    return reply.status(200).send(updated);
  };

  app.patch(
    '/:id/pay',
    {
      schema: payTransactionSwaggerSchema,
      preHandler: [app.authenticate],
    },
    payHandler
  );

  app.patch(
    '/transactions/:id/pay',
    {
      schema: payTransactionSwaggerSchema,
      preHandler: [app.authenticate],
    },
    payHandler
  );

  // ─── GET /:id e /transactions/:id — Detalhe da Transação ───────────────────
  const getByIdHandler = async (request: any, reply: any) => {
    const { id } = transactionIdParamSchema.parse(request.params);
    const transaction = await financialService.getTransactionById(app.prisma, id);
    return reply.status(200).send(transaction);
  };

  app.get(
    '/:id',
    {
      preHandler: [app.authenticate],
    },
    getByIdHandler
  );

  app.get(
    '/transactions/:id',
    {
      preHandler: [app.authenticate],
    },
    getByIdHandler
  );
};
