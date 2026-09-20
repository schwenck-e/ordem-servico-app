# ELI-8: Setup da Arquitetura Fastify, TypeScript, Prisma SQLite e Swagger — Implementation Plan

## Overview

Este plano estabelece a infraestrutura fundacional de backend para o projeto **Sistema de Gestão de Ordens de Serviço** (`ordem-servico-app`), correspondente ao ticket **[ELI-8](https://linear.app/elima/issue/ELI-8)** do épico **[ELI-7](https://linear.app/elima/issue/ELI-7)**.

O objetivo é estruturar o subdiretório `server/` com Node.js LTS e TypeScript estrito, configurar o framework Fastify com logs estruturados via Pino, habilitar CORS, configurar documentação dinâmica OpenAPI/Swagger exposta em `/docs`, integrar o ORM Prisma conectado a um banco local SQLite (`dev.db`), e disponibilizar o endpoint de integridade operacional `GET /health`.

---

## Current State Analysis

A inspeção do repositório `/Users/egsl/Documents/ordem-servico-app` no commit `067a378078fce5b2f830fdbd2d0ff3418fa79ec7` aponta:
- O repositório contém apenas a estrutura de documentação (`thoughts/shared/research/`), configurações de integração (`.antigravity/mcp_config.json`) e o histórico Git inicial.
- Não existem arquivos de código nem dependências instaladas (`server/`, `client/`, `package.json`, `tsconfig.json` ainda não foram criados).
- A especificação técnica completa e o backlog de requisitos estão formalizados em `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md` e detalhados para ELI-8 em `thoughts/shared/research/2026-09-19-ELI-8-backend-architecture-setup.md`.

---

## Desired End State

Ao término da execução deste plano:
1. O monorepo possui o diretório `server/` configurado com runtime Node.js v20+ e TypeScript sem erros de tipagem estrita.
2. Scripts executáveis via npm/pnpm estão operacionais em `server/`: `npm run dev` (com recarregamento a quente via `tsx watch`), `npm run build` (`tsc`) e `npm run start` (`node dist/server.js`).
3. O servidor Fastify inicializa na porta configurável (padrão `3333` ou `PORT` do `.env`), com registro desacoplado em `src/app.ts` e inicialização de rede com *graceful shutdown* em `src/server.ts`.
4. Plugins essenciais ativos:
   - `@fastify/cors`: Habilitado para consumo local do frontend (porta `5173` ou coringa configurado em desenvolvimento).
   - `pino`: Logs estruturados e formatados em desenvolvimento (`pino-pretty`).
   - `@fastify/swagger` + `@fastify/swagger-ui`: Interface interativa de documentação acessível em `http://localhost:3333/docs`.
   - Error Handler global capturando erros de validação e exceções não tratadas com formato JSON padronizado.
5. Prisma ORM configurado com provider SQLite (`file:./dev.db`), cliente gerado e anexado ao Fastify via plugin/singleton.
6. Rota `GET /health` responde `200 OK` com payload contendo status, timestamp ISO e verificação ativa de conexão com o banco de dados SQLite (`$queryRaw` / verificação do Prisma).

---

### Key Discoveries:
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:85-100`: Arquitetura modular recomendada prevê `src/app.ts` isolado de `src/server.ts` para viabilizar testes de integração sem bind de porta.
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:63-70`: Stack padronizada: Fastify, TypeScript, Prisma com SQLite, Zod para validações e `@fastify/swagger` para OpenAPI.
- `thoughts/shared/research/2026-09-19-ELI-8-backend-architecture-setup.md:95-99`: ELI-8 é o predecessor bloqueante direto de ELI-9 (Modelagem do Prisma) e ELI-10 (Setup do Frontend React).

---

## What We're NOT Doing

Para garantir foco estrito no escopo de fundação de ELI-8:
- **NÃO** modelar entidades de negócio complexas (`Customer`, `Technician`, `WorkOrder`, `WorkOrderItem`, `WorkOrderLog`) nem gerar migrações dessas entidades (escopo dedicado de **ELI-9**).
- **NÃO** criar as rotas CRUD de negócios nem regras de validação de clientes, técnicos ou ordens de serviço (escopo de **ELI-11**, **ELI-12**, **ELI-14** e **ELI-15**).
- **NÃO** inicializar a estrutura do frontend React/Vite na pasta `client/` (escopo de **ELI-10**).
- **NÃO** configurar autenticação JWT ou RBAC (não previstos para a versão inicial do backlog local).

---

## Implementation Approach

Adota-se uma abordagem progressiva em 5 fases interdependentes:
1. **Configuração Raiz do Projeto**: Definição do `.gitignore`, gerenciamento de versão Node (`.nvmrc`) e arquivo base `package.json` na raiz para orquestração de scripts.
2. **Setup do Pacote `server/` e Compilador TypeScript**: Criação do `server/package.json`, instalação das dependências centrais, configuração de `tsconfig.json` estrito e scripts de ciclo de vida.
3. **Setup da Camada Prisma e Banco SQLite**: Inicialização do Prisma ORM com provider `sqlite`, criação do `schema.prisma` base, script de migração inicial e plugin singleton de conexão Fastify.
4. **Setup do Core Fastify, Plugins, Swagger e Error Handling**: Estruturação de `src/app.ts` com CORS, logger Pino, plugins `@fastify/swagger` + `@fastify/swagger-ui`, e formatador global de erros.
5. **Implementação da Rota `/health`, Servidor HTTP e Verificação**: Criação da rota `GET /health` com checagem de conectividade do banco, arquivo `src/server.ts` com captura de sinais de encerramento (`SIGINT`/`SIGTERM`) e validação automatizada dos requisitos.

---

## Phase 1: Configuração Raiz do Repositório

### Overview
Garantir o isolamento de artefatos temporários, dependências e dados locais no Git, além de padronizar a versão do Node.js para o repositório.

### Changes Required:

#### 1. `.gitignore`
**File**: `.gitignore`  
**Changes**: Adicionar regras para ignorar `node_modules`, builds (`dist/`, `build/`), variáveis de ambiente (`.env`, `.env.local`), banco de dados local SQLite (`*.db`, `*.db-journal`), logs e artefatos de IDE.

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
dist/
build/

# Environment files
.env
.env.*
!.env.example

# SQLite local database
*.db
*.db-journal
*.db-wal
*.db-shm

# OS and IDE files
.DS_Store
Thumbs.db
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

#### 2. `.nvmrc`
**File**: `.nvmrc`  
**Changes**: Fixar o runtime Node.js na versão LTS atual (v20 ou v22).

```text
20
```

#### 3. `package.json` (Raiz)
**File**: `package.json`  
**Changes**: Definir o projeto raiz como monorepo simples permitindo executar scripts do backend com facilidade.

```json
{
  "name": "ordem-servico-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "server"
  ],
  "scripts": {
    "dev:server": "npm run dev --workspace=server",
    "build:server": "npm run build --workspace=server"
  },
  "devDependencies": {}
}
```

### Success Criteria:

#### Automated Verification:
- [x] Arquivo `.gitignore` existe e cobre `node_modules`, `.env` e `*.db`: `test -f .gitignore`
- [x] Arquivo `.nvmrc` existe: `test -f .nvmrc`
- [x] Arquivo `package.json` na raiz existe e é válido: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`

#### Manual Verification:
- [x] O comando `git status` não rastreia arquivos ignorados.

**Implementation Note**: Após concluir esta fase e validar a integridade dos arquivos raiz, seguir para a Fase 2.

---

## Phase 2: Setup do Pacote `server/` e Compilador TypeScript

### Overview
Estruturar o subdiretório `server/`, inicializar as dependências de produção e desenvolvimento, e configurar o TypeScript para compilação estrita compatível com Node 20+.

### Changes Required:

#### 1. `server/package.json`
**File**: `server/package.json`  
**Changes**: Configurar dependências e scripts do serviço backend.
- Dependências de Produção: `fastify`, `@fastify/cors`, `@fastify/swagger`, `@fastify/swagger-ui`, `@prisma/client`, `dotenv`, `zod`, `pino`, `pino-pretty`.
- Dependências de Desenvolvimento: `typescript`, `@types/node`, `tsx`, `prisma`, `rimraf`.

```json
{
  "name": "server",
  "version": "1.0.0",
  "description": "Backend API para Sistema de Gestão de Ordens de Serviço",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "rimraf dist && tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/swagger": "^8.14.0",
    "@fastify/swagger-ui": "^4.0.0",
    "@prisma/client": "^5.19.1",
    "dotenv": "^16.4.5",
    "fastify": "^4.28.1",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.16.5",
    "prisma": "^5.19.1",
    "rimraf": "^6.0.1",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4"
  }
}
```

#### 2. `server/tsconfig.json`
**File**: `server/tsconfig.json`  
**Changes**: Configurar TypeScript com tipagem estrita, ES2022/NodeNext e resolução moderna de módulos.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "prisma"]
}
```

#### 3. `server/.env.example` e `server/.env`
**File**: `server/.env.example`  
**Changes**: Definir as variáveis de ambiente essenciais com documentação dos valores padrão.

```env
# Application Server
PORT=3333
HOST=0.0.0.0
NODE_ENV=development

# Database Connection (SQLite)
DATABASE_URL="file:./dev.db"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### Success Criteria:

#### Automated Verification:
- [x] Instalação de dependências no `server/` conclui com sucesso: `cd server && npm install`
- [x] Verificação de tipos estritos do TypeScript executa sem erros: `cd server && npm run typecheck`
- [x] Arquivo `server/.env` criado a partir de `.env.example`: `test -f server/.env`

#### Manual Verification:
- [x] As versões instaladas de `fastify` e `prisma` estão compatíveis e sem avisos de depreciação graves.

**Implementation Note**: Após o sucesso da compilação inicial e da resolução de pacotes, avançar para a Fase 3.

---

## Phase 3: Setup da Camada Prisma e Banco SQLite

### Overview
Inicializar a camada de persistência com o Prisma ORM apontando para SQLite local, configurar o schema base com verificação de conexão e expor o singleton do Prisma Client via plugin Fastify.

### Changes Required:

#### 1. `server/prisma/schema.prisma`
**File**: `server/prisma/schema.prisma`  
**Changes**: Configurar o datasource SQLite e generator Prisma Client, mantendo uma modelagem base inicial compatível com checagem de saúde sem antecipar o escopo do ticket ELI-9.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Modelo de verificação inicial para validação da conectividade e migrações (ELI-8)
model AppHealth {
  id        String   @id @default(uuid())
  checkedAt DateTime @default(now())
  status    String   @default("UP")
}
```

#### 2. `server/src/config/env.ts`
**File**: `server/src/config/env.ts`  
**Changes**: Validação e carregamento de variáveis de ambiente com Zod, garantindo fail-fast caso `PORT` ou `DATABASE_URL` sejam inválidos.

```typescript
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Variáveis de ambiente inválidas:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas.');
}

export const env = _env.data;
```

#### 3. `server/src/plugins/prisma.ts`
**File**: `server/src/plugins/prisma.ts`  
**Changes**: Criar o plugin Fastify encapsulando a instância singleton do Prisma Client e tratando o encerramento gracioso da conexão (`$disconnect`).

```typescript
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
```

### Success Criteria:

#### Automated Verification:
- [x] Geração do Prisma Client: `cd server && npx prisma generate`
- [x] Execução da migração inicial criando `dev.db`: `cd server && npx prisma migrate dev --name init_health`
- [x] Arquivo de banco de dados SQLite `server/prisma/dev.db` criado: `test -f server/prisma/dev.db`

#### Manual Verification:
- [x] Prisma Client compila com tipos gerados disponíveis em `@prisma/client`.

**Implementation Note**: Após certificar que o Prisma conectou ao SQLite e gerou os tipos, passar para a Fase 4.

---

## Phase 4: Configuração da Aplicação Fastify, Plugins, Swagger e Error Handling

### Overview
Configurar a fábrica da aplicação Fastify em `src/app.ts`, integrando CORS, documentação OpenAPI/Swagger interativa e tratamento de erros padronizado.

### Changes Required:

#### 1. `server/src/plugins/cors.ts`
**File**: `server/src/plugins/cors.ts`  
**Changes**: Registro de `@fastify/cors` com suporte à origem do frontend React (`http://localhost:5173`) e métodos HTTP habituais.

```typescript
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env';

export default fp(async (app) => {
  await app.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  });
});
```

#### 2. `server/src/plugins/swagger.ts`
**File**: `server/src/plugins/swagger.ts`  
**Changes**: Configurar `@fastify/swagger` e `@fastify/swagger-ui` para servir a documentação interativa em `/docs`.

```typescript
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
```

#### 3. `server/src/app.ts`
**File**: `server/src/app.ts`  
**Changes**: Construir e exportar a função construtora `buildApp()` que registra todos os plugins, anexa rotas e aplica tratamento de erros global.

```typescript
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
        target: 'pino-pretty',
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
```

### Success Criteria:

#### Automated Verification:
- [x] Checagem estática de tipos do Fastify, Swagger e plugins: `cd server && npm run typecheck`
- [x] Compilação limpa do projeto com `tsc`: `cd server && npm run build`

#### Manual Verification:
- [x] O Swagger UI é montado corretamente no prefixo `/docs`.

**Implementation Note**: Após validar o encapsulamento em `buildApp()`, prosseguir para a Fase 5.

---

## Phase 5: Rota de Healthcheck, Ponto de Entrada HTTP e Validação Final

### Overview
Implementar a rota operacional `GET /health` integrada ao Prisma SQLite, criar o entrypoint `src/server.ts` com gerenciamento de lifecycle de processo, e validar todos os critérios de aceitação do DoD de ELI-8.

### Changes Required:

#### 1. `server/src/modules/health/health.routes.ts`
**File**: `server/src/modules/health/health.routes.ts`  
**Changes**: Definir a rota `GET /` (com prefixo `/health`) retornando status 200, timestamp ISO e resultado de verificação do banco de dados SQLite.

```typescript
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
```

#### 2. `server/src/server.ts`
**File**: `server/src/server.ts`  
**Changes**: Ponto de entrada executável que invoca `buildApp()`, inicia o listen HTTP e trata sinais `SIGINT` e `SIGTERM`.

```typescript
import { buildApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    app.log.info(`🚀 Servidor Fastify ativo e ouvindo em ${address}`);
    app.log.info(`📄 Documentação Swagger disponível em ${address}/docs`);
    app.log.info(`🩺 Healthcheck disponível em ${address}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.warn(`Recebido sinal ${signal}, encerrando aplicação de forma graciosa...`);
      await app.close();
      process.exit(0);
    });
  }
}

bootstrap();
```

### Success Criteria:

#### Automated Verification:
- [x] Compilação de produção sem erros: `cd server && npm run build`
- [x] Execução do servidor e requisição ao healthcheck retornando 200 OK:
  ```bash
  cd server && npm run build && (node dist/server.js & SERVER_PID=$!; sleep 2; curl -sS http://localhost:3333/health | grep '"status":"ok"'; kill $SERVER_PID)
  ```
- [x] Requisição à documentação Swagger retornando 200 OK:
  ```bash
  (cd server && node dist/server.js & SERVER_PID=$!; sleep 2; curl -sS -I http://localhost:3333/docs/ | grep '200 OK'; kill $SERVER_PID)
  ```
- [x] Scripts `dev`, `build` e `start` cadastrados no `server/package.json`: `grep -E '"dev"|"build"|"start"' server/package.json`

#### Manual Verification:
- [x] Acessar `http://localhost:3333/docs` no navegador e verificar se o Swagger UI renderiza a tag `Health` e o endpoint `GET /health` de forma interativa.
- [x] Testar cancelamento com `Ctrl+C` no terminal e observar as mensagens de log de encerramento gracioso do Fastify e do Prisma.

**Implementation Note**: Após passar por todas as verificações automáticas e manuais, o ticket ELI-8 estará formalmente concluído e pronto para transição para o ticket ELI-9.

---

## Testing Strategy

### Unit / Component Tests:
- Validação do schema do Zod para variáveis de ambiente (`server/src/config/env.ts`), testando defaults e rejeição de tipos inválidos.
- Teste de injeção direta do Fastify (`app.inject()`) sem subir porta de rede para validar o endpoint `GET /health`.

### Integration Tests:
- Teste do fluxo completo de inicialização de `buildApp()`, verificação de `$connect()` no SQLite e resposta estruturada contendo `"database": { "status": "connected" }`.
- Teste de disponibilidade do Swagger UI em `/docs/` e especificação JSON em `/docs/json`.

### Manual Testing Steps:
1. Executar `cd server && npm run dev` no terminal.
2. Em outro terminal, executar `curl -i http://localhost:3333/health` e conferir se o código HTTP é `200 OK` e o JSON possui timestamp válido.
3. Abrir o navegador em `http://localhost:3333/docs` e clicar em *Try it out* na rota `/health`.
4. Verificar se os logs no terminal são emitidos com formatação colorida via `pino-pretty`.

---

## Performance Considerations

- **Fastify vs Express**: A escolha do Fastify reduz o overhead de middleware e fornece throughput significativamente superior com serialização otimizada de schemas.
- **SQLite Concurrency**: SQLite em modo WAL (Write-Ahead Logging) suporta múltiplas leituras simultâneas sem bloqueio para a carga esperada do projeto.
- **Lazy/Cached OpenAPI**: A especificação Swagger é gerada em memória durante a inicialização, evitando processamento em runtime por requisição.

---

## Migration Notes

- Por ser a primeira tarefa de infraestrutura (ELI-8), não há dados legados a migrar.
- A migração `init_health` do Prisma apenas valida a integridade do SQLite e o fluxo automatizado do CLI do Prisma no repositório.

---

## References

- Ticket Linear: [ELI-8](https://linear.app/elima/issue/ELI-8) (`[Backend] Setup da Arquitetura Fastify, TypeScript, Prisma SQLite e Swagger`)
- Épico Linear: [ELI-7](https://linear.app/elima/issue/ELI-7) (`[ÉPICO] Sistema de Gestão de Ordens de Serviço`)
- Research Document: [`thoughts/shared/research/2026-09-19-ELI-8-backend-architecture-setup.md`](file:///Users/egsl/Documents/ordem-servico-app/thoughts/shared/research/2026-09-19-ELI-8-backend-architecture-setup.md)
- Backlog Consolidado: [`thoughts/shared/research/2026-09-15-ordem-servico-backlog.md`](file:///Users/egsl/Documents/ordem-servico-app/thoughts/shared/research/2026-09-15-ordem-servico-backlog.md)
