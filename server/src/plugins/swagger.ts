import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'API Ordem de Serviço',
        description: 'Documentação da API para o Sistema de Gestão de Ordens de Serviço',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: 'Servidor Local'
        }
      ],
      tags: [
        { name: 'Health', description: 'Monitoramento e integridade do sistema' },
        { name: 'Customers', description: 'Gestão de clientes' },
        { name: 'Technicians', description: 'Gestão de técnicos' },
        { name: 'WorkOrders', description: 'Gestão e workflow de ordens de serviço' }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });
});
