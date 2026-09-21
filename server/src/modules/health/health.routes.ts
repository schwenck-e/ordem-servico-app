import { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', {
    schema: {
      tags: ['Health'],
      summary: 'Verificação de integridade da API e banco de dados',
      description: 'Retorna 200 OK com timestamp e status da conectividade SQLite.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2026-09-19T22:00:00.000Z' },
            uptime: { type: 'number', example: 12.34 },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'connected' }
              }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Validação de consulta ativa no SQLite via Prisma
      await app.prisma.$queryRaw`SELECT 1`;

      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected'
        }
      });
    } catch (err: any) {
      app.log.error({ err }, 'Erro ao conectar ao banco SQLite durante healthcheck');
      return reply.status(500).send({
        status: 'error',
        error: 'Falha na conexão com o banco de dados local.'
      });
    }
  });
};
