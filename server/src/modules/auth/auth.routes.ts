import { FastifyPluginAsync } from 'fastify';
import { loginSchema, registerSchema, loginSwaggerSchema, getMeSwaggerSchema, registerSwaggerSchema } from './auth.schemas';
import * as authService from './auth.service';

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /auth/login — Authenticate and get JWT token
  app.post('/login', {
    schema: loginSwaggerSchema
  }, async (request, reply) => {
    const data = loginSchema.parse(request.body);

    const user = await authService.validateUserCredentials(app.prisma, data.email, data.password);

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'E-mail ou senha inválidos.'
      });
    }

    if (!user.isActive) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Conta desativada. Entre em contato com o administrador.'
      });
    }

    const token = app.jwt.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'OPERATOR'
    });

    return reply.status(200).send({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });

  // GET /auth/me — Get authenticated user profile from token
  app.get('/me', {
    schema: getMeSwaggerSchema,
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    return reply.status(200).send({
      id: request.user.id,
      name: request.user.name,
      email: request.user.email,
      role: request.user.role
    });
  });

  // POST /auth/register — Register first admin or create user (requires ADMIN)
  app.post('/register', {
    schema: registerSwaggerSchema
  }, async (request, reply) => {
    const data = registerSchema.parse(request.body);

    // Count existing users to determine if this is the first user
    const userCount = await app.prisma.user.count();
    const isFirstUser = userCount === 0;

    if (!isFirstUser) {
      // Subsequent registrations require ADMIN authentication
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Token de autenticação ausente ou inválido.'
        });
      }

      const requester = request.user;
      if (requester.role !== 'ADMIN') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Apenas administradores podem cadastrar novos usuários.'
        });
      }
    }

    const user = await authService.registerUser(app.prisma, data, isFirstUser);

    return reply.status(201).send(user);
  });
};
