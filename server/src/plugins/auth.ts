import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (allowedRoles: ('ADMIN' | 'OPERATOR')[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUserPayload;
  }
}

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  // Register JWT plugin with secret from environment
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });

  // Decorator: authenticate — verifies Bearer JWT token
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token de autenticação ausente ou inválido.'
      });
    }
  });

  // Decorator: requireRole — checks role after authentication
  app.decorate('requireRole', (allowedRoles: ('ADMIN' | 'OPERATOR')[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Ensure authenticate ran previously
      if (!request.user) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Autenticação necessária.'
        });
      }
      if (!allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Acesso negado: seu perfil não possui permissão para esta operação.'
        });
      }
    };
  });
});

export default authPlugin;
