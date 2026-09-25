import { FastifyPluginAsync } from 'fastify';
import {
  createTechnicianSchema,
  updateTechnicianSchema,
  technicianIdParamSchema,
  listTechniciansQuerySchema,
  createTechnicianSwaggerSchema,
  listTechniciansSwaggerSchema,
  getTechnicianSwaggerSchema,
  updateTechnicianSwaggerSchema,
  deleteTechnicianSwaggerSchema,
} from './technician.schemas';
import * as technicianService from './technician.service';

export const technicianRoutes: FastifyPluginAsync = async (app) => {
  // POST / — Cadastrar novo técnico
  app.post('/', {
    schema: createTechnicianSwaggerSchema,
  }, async (request, reply) => {
    const data = createTechnicianSchema.parse(request.body);
    const technician = await technicianService.createTechnician(app.prisma, data);
    return reply.status(201).send(technician);
  });

  // GET / — Listar técnicos (paginado, com busca e filtros)
  app.get('/', {
    schema: listTechniciansSwaggerSchema,
  }, async (request, reply) => {
    const query = listTechniciansQuerySchema.parse(request.query);
    const result = await technicianService.listTechnicians(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /:id — Buscar técnico por UUID
  app.get('/:id', {
    schema: getTechnicianSwaggerSchema,
  }, async (request, reply) => {
    const { id } = technicianIdParamSchema.parse(request.params);
    const technician = await technicianService.getTechnicianById(app.prisma, id);
    return reply.status(200).send(technician);
  });

  // PUT /:id — Atualizar técnico
  app.put('/:id', {
    schema: updateTechnicianSwaggerSchema,
  }, async (request, reply) => {
    const { id } = technicianIdParamSchema.parse(request.params);
    const data = updateTechnicianSchema.parse(request.body);
    const technician = await technicianService.updateTechnician(app.prisma, id, data);
    return reply.status(200).send(technician);
  });

  // DELETE /:id — Excluir técnico
  app.delete('/:id', {
    schema: deleteTechnicianSwaggerSchema,
  }, async (request, reply) => {
    const { id } = technicianIdParamSchema.parse(request.params);
    await technicianService.deleteTechnician(app.prisma, id);
    return reply.status(204).send();
  });
};
