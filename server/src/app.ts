import fastify, { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import corsPlugin from './plugins/cors';
import swaggerPlugin from './plugins/swagger';
import prismaPlugin from './plugins/prisma';
import { healthRoutes } from './modules/health/health.routes';
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

  // Registro de Plugins Principais
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);

  // Registro de Rotas
  await app.register(healthRoutes, { prefix: '/health' });

  // Tratamento Global de Erros
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Falha na validação dos dados de entrada.',
        issues: error.format()
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name || 'Error',
        message: error.message
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno inesperado no servidor.'
    });
  });

  return app;
}
