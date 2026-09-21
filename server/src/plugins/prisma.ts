import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
  const prisma = new PrismaClient({
    log: server.log.level === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error']
  });

  await prisma.$connect();
  server.log.info('📦 Prisma conectado com sucesso ao SQLite.');

  server.decorate('prisma', prisma);

  server.addHook('onClose', async (appInstance) => {
    await appInstance.prisma.$disconnect();
    server.log.info('📦 Conexão do Prisma com SQLite encerrada.');
  });
});

export default prismaPlugin;
