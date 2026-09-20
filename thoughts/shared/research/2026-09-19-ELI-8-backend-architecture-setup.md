---
date: 2026-09-19T21:52:00-03:00
researcher: schwenck-e
git_commit: 067a378078fce5b2f830fdbd2d0ff3418fa79ec7
branch: main
repository: schwenck-e/ordem-servico-app
topic: "ELI-8: Setup da Arquitetura Fastify, TypeScript, Prisma SQLite e Swagger"
tags: [research, codebase, backend, fastify, prisma, sqlite, swagger, ELI-8, ELI-7]
status: complete
last_updated: 2026-09-19
last_updated_by: schwenck-e
---

# Research: ELI-8 — Setup da Arquitetura Fastify, TypeScript, Prisma SQLite e Swagger

**Date**: 2026-09-19T21:52:00-03:00  
**Researcher**: schwenck-e  
**Git Commit**: 067a378078fce5b2f830fdbd2d0ff3418fa79ec7  
**Branch**: main  
**Repository**: schwenck-e/ordem-servico-app  

## Research Question
Documentar e mapear os requisitos, o estado atual do repositório e os componentes arquiteturais vinculados ao ticket **ELI-8** (`[Backend] Setup da Arquitetura Fastify, TypeScript, Prisma SQLite e Swagger`).

---

## Summary

O ticket **ELI-8** é a primeira tarefa técnica de backend do épico **ELI-7** (`[ÉPICO] Sistema de Gestão de Ordens de Serviço (ordem-servico-app)`), com prioridade **Urgente (P1)**. Seu propósito é estabelecer a fundação do monorepo no diretório `server/`, configurando o runtime Node.js LTS com TypeScript estrito, o framework HTTP Fastify com plugins essenciais (CORS, logs Pino, Swagger/OpenAPI), o ORM Prisma conectado a um banco de dados local SQLite (`dev.db`), além do endpoint de verificação de integridade (`GET /health`).

No estado atual do repositório no commit `067a378078fce5b2f830fdbd2d0ff3418fa79ec7`, o código-fonte da aplicação (`server/` e `client/`) ainda não foi materializado no disco. O repositório abriga a documentação e especificação detalhada do produto em `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md` e a configuração de integração Linear em `.antigravity/mcp_config.json`.

---

## Detailed Findings

### 1. Metadados e Definição da Tarefa no Linear (ELI-8)
- **ID da Issue:** `8fc0b4f4-ea8b-4fe8-8d70-6a5cab46708f`
- **Identificador:** `ELI-8`
- **Título:** `[Backend] Setup da Arquitetura Fastify, TypeScript, Prisma SQLite e Swagger`
- **Projeto Linear:** `Sistema de Gestão de Ordens de Serviço (ordem-servico-app)`
- **Épico Pai:** `ELI-7` — `[ÉPICO] Sistema de Gestão de Ordens de Serviço (ordem-servico-app)` (`9f27c6ed-da80-4ffa-8470-8f9acc7d6f56`)
- **Prioridade:** 1 (Urgente)
- **Status:** Backlog / Todo
- **Critérios de Aceitação / Definition of Done (DoD):**
  - [ ] Projeto backend configurado com `package.json`, `tsconfig.json` e scripts (`dev`, `build`, `start`).
  - [ ] Fastify configurado com CORS, plugin de log (`pino`) e tratamento global de erros.
  - [ ] Prisma ORM configurado com provider SQLite e conexão validada.
  - [ ] Swagger / OpenAPI documentado e acessível na rota `/docs`.
  - [ ] Endpoint de healthcheck `GET /health` respondendo 200 OK com timestamp.

### 2. Estado Físico do Repositório Local
A inspeção da raiz `/Users/egsl/Documents/ordem-servico-app` evidencia:
- **Arquivos presentes no disco:**
  - `.git/` — repositório Git local sincronizado com `https://github.com/schwenck-e/ordem-servico-app.git` na branch `main`.
  - `.antigravity/mcp_config.json` — configuração do servidor MCP Linear com credenciais de API.
  - `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md` — especificação técnica completa, diagramas e backlog consolidado.
  - `thoughts/shared/tickets/`, `thoughts/shared/plans/`, `thoughts/shared/handoffs/` — diretórios preparados para artefatos do ciclo de vida.
- **Inexistência de Código de Aplicação:**
  - Não há diretório `server/` nem `client/`.
  - Não há `package.json`, `node_modules` ou `tsconfig.json` na raiz ou em subdiretórios.
  - Toda a fundação arquitetural de backend descrita em ELI-8 está pendente de implementação física.

### 3. Especificação Técnica e Dependências no Backlog
Conforme documentado em `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md`:

#### 3.1 Stack Tecnológica do Backend (Linhas 63–70)
- **Runtime:** Node.js (LTS v20+) com TypeScript estrito.
- **Servidor HTTP:** Fastify (v4 ou v5) priorizando baixa latência, arquitetura por plugins e tipagem integrada.
- **Banco de Dados & ORM:** Prisma ORM apontando para SQLite local (`dev.db`).
- **Validação de Schemas:** Zod para tipagem inferida e validação em tempo de execução.
- **Documentação de API:** `@fastify/swagger` e `@fastify/swagger-ui` expondo `/docs`.
- **Utilitários Adicionais:** `@fastify/cors` para comunicação com frontend, `pino` para logs estruturados, `date-fns` para manipulação temporal.

#### 3.2 Estrutura de Diretórios Planejada para `server/` (Linhas 85–100)
```text
server/
├── prisma/
│   ├── schema.prisma     # Definição do banco e modelos
│   ├── migrations/       # Histórico de migrações
│   └── seed.ts           # Dados de teste para desenvolvimento
├── src/
│   ├── config/           # Configurações de ambiente (.env)
│   ├── plugins/          # Plugins Fastify (prisma, swagger, cors)
│   ├── modules/          # Módulos por domínio (customers, technicians, work-orders, metrics)
│   │   ├── [module].routes.ts
│   │   ├── [module].schemas.ts
│   │   └── [module].service.ts
│   ├── app.ts            # Configuração e registro de plugins do Fastify
│   └── server.ts         # Ponto de entrada (listen HTTP)
├── tsconfig.json
└── package.json
```

#### 3.3 Conexão com Outros Itens do Backlog
- **Predecessor de ELI-9:** [ELI-9](thoughts/shared/research/2026-09-15-ordem-servico-backlog.md#L253-L261) (`Modelagem do Banco de Dados Prisma: Schema, Migrations e Seeds`) depende diretamente da infraestrutura do Prisma e da pasta `server/` inicializadas por ELI-8.
- **Predecessor de ELI-10:** [ELI-10](thoughts/shared/research/2026-09-15-ordem-servico-backlog.md#L262-L271) (`Setup do React Vite + Tailwind CSS + Roteamento e API Client`) requer a URL base do backend e o endpoint `GET /health` ativo para teste de integração HTTP.
- **Base para os Módulos REST (ELI-11, ELI-12, ELI-14, ELI-15, ELI-19):** Todas as rotas de domínio dependem dos plugins de validação, tratamento de erros e Swagger configurados nesta etapa.

---

## Code References
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:26-59` — Diagrama da arquitetura de fluxo Fastify -> Zod -> Services -> Prisma -> SQLite.
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:63-70` — Especificação da stack tecnológica do backend.
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:85-100` — Estrutura de arquivos para `server/`.
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:223` — Entrada de ELI-8 na matriz de tarefas consolidadas.
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md:244-252` — Descrição do ticket ELI-8 e critérios de aceitação (DoD).
- `.antigravity/mcp_config.json:1-12` — Configuração do MCP Linear para rastreamento de tickets.

---

## Architecture Documentation

### Padrão de Arquitetura Fastify Previsto
1. **Ponto de Inicialização Desacoplado:**
   - `src/app.ts`: Constrói a instância Fastify, registra os plugins (Swagger, CORS, Prisma), configura tratamento centralizado de erros e anexa rotas.
   - `src/server.ts`: Responsável exclusivamente pelo binding de porta (`app.listen({ port, host })`) e graceful shutdown.
2. **Documentação Integrada OpenAPI:**
   - `@fastify/swagger` gera a especificação OpenAPI dinamicamente a partir dos schemas de rota.
   - `@fastify/swagger-ui` serve a interface gráfica interativa em `/docs`.
3. **Persistência Local Autocontida:**
   - Driver SQLite com arquivo local (`dev.db`), eliminando dependências externas de infraestrutura para ambiente de desenvolvimento.
4. **Verificação Operacional:**
   - Endpoint canônico `GET /health` fornecendo status da aplicação (`{"status": "ok", "timestamp": "..."}`) e validando conectividade com o banco.

---

## Historical Context (from thoughts/)
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md` — Documento de especificação técnica e backlog do produto aprovado em 2026-09-15 (revisado em 2026-09-19), definindo a arquitetura monorepo e as 14 tarefas distribuídas em 4 sprints.

---

## Related Research
- `thoughts/shared/research/2026-09-15-ordem-servico-backlog.md` — Especificação Técnica & Backlog do Produto: Gestão de Ordens de Serviço (ordem-servico-app).

---

## Open Questions
- A raiz do monorepo utilizará npm workspaces, pnpm ou workspaces padrão de Node.js para os scripts unificados do ciclo de vida (`package.json` raiz coordenando `server/` e `client/`)?
- Qual a porta padrão estipulada para o backend Fastify em desenvolvimento (ex: `3333` ou `3000`) a ser consumida pelo cliente em ELI-10?
