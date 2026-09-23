import { FastifyPluginAsync } from 'fastify';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  createCustomerSwaggerSchema,
  listCustomersSwaggerSchema,
  getCustomerSwaggerSchema,
  updateCustomerSwaggerSchema,
  deleteCustomerSwaggerSchema,
} from './customer.schemas';
import * as customerService from './customer.service';

export const customerRoutes: FastifyPluginAsync = async (app) => {
  // POST / — Cadastrar novo cliente
  app.post('/', {
    schema: createCustomerSwaggerSchema,
  }, async (request, reply) => {
    const data = createCustomerSchema.parse(request.body);
    const customer = await customerService.createCustomer(app.prisma, data);
    return reply.status(201).send(customer);
  });

  // GET / — Listar clientes (paginado, com busca)
  app.get('/', {
    schema: listCustomersSwaggerSchema,
  }, async (request, reply) => {
    const query = listCustomersQuerySchema.parse(request.query);
    const result = await customerService.listCustomers(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /:id — Buscar cliente por UUID
  app.get('/:id', {
    schema: getCustomerSwaggerSchema,
  }, async (request, reply) => {
    const { id } = customerIdParamSchema.parse(request.params);
    const customer = await customerService.getCustomerById(app.prisma, id);
    return reply.status(200).send(customer);
  });

  // PUT /:id — Atualizar cliente
  app.put('/:id', {
    schema: updateCustomerSwaggerSchema,
  }, async (request, reply) => {
    const { id } = customerIdParamSchema.parse(request.params);
    const data = updateCustomerSchema.parse(request.body);
    const customer = await customerService.updateCustomer(app.prisma, id, data);
    return reply.status(200).send(customer);
  });

  // DELETE /:id — Excluir cliente
  app.delete('/:id', {
    schema: deleteCustomerSwaggerSchema,
  }, async (request, reply) => {
    const { id } = customerIdParamSchema.parse(request.params);
    await customerService.deleteCustomer(app.prisma, id);
    return reply.status(204).send();
  });
};
