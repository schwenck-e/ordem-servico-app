import { FastifyPluginAsync } from 'fastify';
import {
  metricsPeriodQuerySchema,
  metricsSummarySwaggerSchema,
  metricsByStatusSwaggerSchema,
  metricsByTechnicianSwaggerSchema,
} from './metrics.schemas';
import * as metricsService from './metrics.service';

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  // GET /summary — Panorama geral operacional e financeiro
  app.get(
    '/summary',
    {
      schema: metricsSummarySwaggerSchema,
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      const query = metricsPeriodQuerySchema.parse(request.query);
      const summary = await metricsService.getMetricsSummary(app.prisma, query);
      return reply.status(200).send(summary);
    }
  );

  // GET /by-status — Distribuição quantitativa e financeira por status
  app.get(
    '/by-status',
    {
      schema: metricsByStatusSwaggerSchema,
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      const query = metricsPeriodQuerySchema.parse(request.query);
      const byStatus = await metricsService.getMetricsByStatus(app.prisma, query);
      return reply.status(200).send(byStatus);
    }
  );

  // GET /by-technician — Distribuição e produtividade por técnico
  app.get(
    '/by-technician',
    {
      schema: metricsByTechnicianSwaggerSchema,
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      const query = metricsPeriodQuerySchema.parse(request.query);
      const byTechnician = await metricsService.getMetricsByTechnician(app.prisma, query);
      return reply.status(200).send(byTechnician);
    }
  );
};
