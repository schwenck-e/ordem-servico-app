import { FastifyPluginAsync } from 'fastify';
import {
  updateCompanySchema,
  getCompanySwaggerSchema,
  updateCompanySwaggerSchema,
} from './company.schemas';
import * as companyService from './company.service';

export const companyRoutes: FastifyPluginAsync = async (app) => {
  // GET / — Consultar dados cadastrais (autenticado: ADMIN ou OPERATOR)
  app.get(
    '/',
    {
      schema: getCompanySwaggerSchema,
      preHandler: [app.authenticate],
    },
    async (_request, reply) => {
      const company = await companyService.getCompany(app.prisma);
      return reply.status(200).send(company);
    }
  );

  // PUT / — Atualizar configurações (exclusivo: ADMIN)
  app.put(
    '/',
    {
      schema: updateCompanySwaggerSchema,
      preHandler: [app.authenticate, app.requireRole(['ADMIN'])],
    },
    async (request, reply) => {
      const data = updateCompanySchema.parse(request.body);
      const updated = await companyService.updateCompany(app.prisma, data);
      return reply.status(200).send(updated);
    }
  );
};
