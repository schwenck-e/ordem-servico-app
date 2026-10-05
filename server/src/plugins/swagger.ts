import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'API Ordem de Serviço — Sistema de Gestão Fullstack',
        description: 'Documentação interativa da API REST para gestão operacional, técnica, comercial e financeira de Ordens de Serviço (Release v1.1).',
        version: '1.1.0'
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: 'Servidor de Desenvolvimento Local'
        }
      ],
      tags: [
        { name: 'Health', description: 'Monitoramento e integridade do sistema e banco SQLite' },
        { name: 'Auth', description: 'Autenticação, login e gestão de sessão JWT' },
        { name: 'Users', description: 'Gestão de colaboradores e controle de acesso RBAC (ADMIN)' },
        { name: 'Company', description: 'Configurações institucionais e dados cadastrais da empresa' },
        { name: 'Customers', description: 'Cadastro e gestão de clientes' },
        { name: 'Technicians', description: 'Gestão da equipe técnica e especialidades' },
        { name: 'Products', description: 'Catálogo de produtos, precificação e estoque de peças sobressalentes' },
        { name: 'Stock', description: 'Registro e histórico auditável de movimentações de estoque (IN/OUT/ADJUSTMENT)' },
        { name: 'Quotes', description: 'Orçamentos comerciais, ciclo de aprovação e conversão em OS' },
        { name: 'WorkOrders', description: 'Gestão operacional de ordens de serviço e máquina de estados' },
        { name: 'Attachments', description: 'Galeria de fotos (BEFORE/AFTER) e documentos anexos da OS' },
        { name: 'Invoices', description: 'Faturamento de ordens de serviço e baixa de pagamentos' },
        { name: 'Financial', description: 'Controle contábil, contas a pagar/receber e fluxo de caixa' },
        { name: 'Metrics', description: 'Indicadores analíticos de desempenho, receita e produtividade' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Insira o token JWT gerado na rota /auth/login. Exemplo: Bearer eyJhbGciOi...'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // Redirecionamento amigável para conveniência
  app.get('/documentation', async (_req, reply) => {
    return reply.redirect('/docs');
  });
});


