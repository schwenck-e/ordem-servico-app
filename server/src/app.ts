import fastify, { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import corsPlugin from './plugins/cors';
import swaggerPlugin from './plugins/swagger';
import prismaPlugin from './plugins/prisma';
import { healthRoutes } from './modules/health/health.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { technicianRoutes } from './modules/technicians/technician.routes';
import { env } from './config/env';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: require.resolve('pino-pretty'),
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    } : true
  });

  // Tratamento Global de Erros — MUST be set before registering routes
  app.setErrorHandler((error, request, reply) => {
    // Detect ZodError via instanceof, name, or duck-typing (handles multiple Zod copies)
    const isZodError = error instanceof ZodError
      || error.name === 'ZodError'
      || (error as any).constructor?.name === 'ZodError'
      || Array.isArray((error as any).issues);

    if (isZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Falha na validação dos dados de entrada.',
        issues: (error as any).issues ?? []
      });
    }

    // Handle known HTTP errors (e.g., 404, 409)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno inesperado no servidor.'
    });
  });

  // Registro de Plugins Principais
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);

  // Registro de Rotas
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(customerRoutes, { prefix: '/customers' });
  await app.register(technicianRoutes, { prefix: '/technicians' });

  return app;
}
