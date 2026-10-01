import { FastifyPluginAsync } from 'fastify';
import {
  listUsersQuerySchema,
  userIdParamSchema,
  createUserSchema,
  updateUserSchema,
  listUsersSwaggerSchema,
  getUserSwaggerSchema,
  createUserSwaggerSchema,
  updateUserSwaggerSchema,
  deleteUserSwaggerSchema
} from './user.schemas';
import * as userService from './user.service';

export const userRoutes: FastifyPluginAsync = async (app) => {
  // All routes require authentication + ADMIN role
  const preHandler = [app.authenticate, app.requireRole(['ADMIN'])];

  // GET / — List users (paginated)
  app.get('/', {
    schema: listUsersSwaggerSchema,
    preHandler
  }, async (request, reply) => {
    const query = listUsersQuerySchema.parse(request.query);
    const result = await userService.listUsers(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /:id — Get user by UUID (ADMIN or self)
  app.get('/:id', {
    schema: getUserSwaggerSchema,
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const { id } = userIdParamSchema.parse(request.params);

    // Allow access if requester is ADMIN or is requesting their own profile
    if (request.user.role !== 'ADMIN' && request.user.id !== id) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Acesso negado: seu perfil não possui permissão para esta operação.'
      });
    }

    const user = await userService.getUserById(app.prisma, id);
    return reply.status(200).send(user);
  });

  // POST / — Create user (ADMIN only)
  app.post('/', {
    schema: createUserSwaggerSchema,
    preHandler
  }, async (request, reply) => {
    const data = createUserSchema.parse(request.body);
    const user = await userService.createUser(app.prisma, data);
    return reply.status(201).send(user);
  });

  // PUT /:id — Update user (ADMIN only)
  app.put('/:id', {
    schema: updateUserSwaggerSchema,
    preHandler
  }, async (request, reply) => {
    const { id } = userIdParamSchema.parse(request.params);
    const data = updateUserSchema.parse(request.body);
    const user = await userService.updateUser(app.prisma, id, data);
    return reply.status(200).send(user);
  });

  // DELETE /:id — Delete user (ADMIN only, self-deletion blocked)
  app.delete('/:id', {
    schema: deleteUserSwaggerSchema,
    preHandler
  }, async (request, reply) => {
    const { id } = userIdParamSchema.parse(request.params);
    await userService.deleteUser(app.prisma, id, request.user.id);
    return reply.status(204).send();
  });
};
