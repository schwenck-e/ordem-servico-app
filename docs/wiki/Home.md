# Sistema de Gestão de Ordens de Serviço — Wiki

Bem-vindo à documentação técnica e arquitetural do **Sistema de Gestão de Ordens de Serviço (`ordem-servico-app`)**.

Esta wiki centraliza as decisões de design, a topologia de componentes, os contratos de API, os diagramas de estado e a modelagem relacional da aplicação.

---

## 📚 Índice da Documentação

1. **[Arquitetura do Sistema (Architecture.md)](./Architecture)**
   - Visão geral da topologia em camadas.
   - Divisão de responsabilidades entre cliente e servidor.
   - Diagramas de fluxo e comunicação ponta a ponta.

2. **[Workflow & Máquina de Estados (State-Machine.md)](./State-Machine)**
   - Ciclo de vida das Ordens de Serviço (`ABERTA`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`).
   - Tabela de transições permitidas e bloqueios.
   - Rastreabilidade e trilha de auditoria (`StatusHistory`).

3. **[Modelagem de Dados (Data-Model.md)](./Data-Model)**
   - Diagrama Entidade-Relacionamento (ERD).
   - Estrutura das tabelas, chaves primárias/estrangeiras e índices Prisma.

4. **[Referência de APIs e Contratos (API-Reference.md)](./API-Reference)**
   - Endpoints REST organizados por domínio.
   - Schemas de validação Zod e tipagem TypeScript compartilhada.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Backend Framework** | Fastify + TypeScript | Servidor HTTP de alta performance e tipagem estrita. |
| **ORM & Database** | Prisma + SQLite | Modelagem de dados declarativa, migrations automáticas e persistência ACID local. |
| **Validação de Dados** | Zod | Schemas de validação em tempo de execução para payloads de entrada. |
| **Frontend Framework** | React 18 + Vite | SPA reativa com carregamento otimizado. |
| **Design System / UI** | Tailwind CSS + Lucide Icons | Interface moderna com suporte a visualização em Tabela e Kanban. |
| **Qualidade & Testes** | Vitest + Supertest | Testes unitários, de integração e suíte E2E do ciclo de vida. |
