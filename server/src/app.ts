import fastify, { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import corsPlugin from './plugins/cors';
import swaggerPlugin from './plugins/swagger';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { technicianRoutes } from './modules/technicians/technician.routes';
import { workOrderRoutes } from './modules/work-orders/work-order.routes';
import { metricsRoutes } from './modules/metrics/metrics.routes';
import { companyRoutes } from './modules/company/company.routes';
import { attachmentRoutes } from './modules/attachments/attachment.routes';
import { productRoutes } from './modules/products/product.routes';
import { stockRoutes } from './modules/stock/stock.routes';
import path from 'path';
import fs from 'fs';
import fastifyStatic from '@fastify/static';
import multipartPlugin from './plugins/multipart';
import { env } from './config/env';

// Criação do diretório de uploads caso não exista
const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const workOrdersUploadDir = path.resolve(uploadsRoot, 'work-orders');
if (!fs.existsSync(workOrdersUploadDir)) {
  fs.mkdirSync(workOrdersUploadDir, { recursive: true });
}

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
  await app.register(authPlugin);
  await app.register(multipartPlugin);
  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: '/uploads/',
    decorateReply: false
  });

  // Registro de Rotas — Públicas
  await app.register(healthRoutes, { prefix: '/health' });

  // Registro de Rotas — Autenticação e Usuários
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(userRoutes, { prefix: '/users' });

  // Registro de Rotas — Domínio (protegidas por autenticação)
  await app.register(customerRoutes, { prefix: '/customers' });
  await app.register(technicianRoutes, { prefix: '/technicians' });
  await app.register(workOrderRoutes, { prefix: '/work-orders' });
  await app.register(attachmentRoutes, { prefix: '/work-orders' });
  await app.register(metricsRoutes, { prefix: '/metrics' });
  await app.register(companyRoutes, { prefix: '/company' });
  await app.register(productRoutes, { prefix: '/products' });
  await app.register(stockRoutes, { prefix: '/stock' });

  return app;
}
