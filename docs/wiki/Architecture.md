# Arquitetura do Sistema e Topologia de Componentes

O `ordem-servico-app` adota uma arquitetura em camadas orientada a serviços e desacoplada, separando claramente o cliente (SPA) do servidor REST.

---

## 🏛️ Visão em Camadas

```mermaid
flowchart TD
    subgraph ClientLayer ["Camada de Apresentação (Frontend React)"]
        UI["React 18 + Vite"]
        Pages["Views: Dashboard, Kanban, Tabela, Detalhes, Cadastros"]
        APIClient["API Client Centralizado (Axios / Fetch)"]
        UI --> Pages
        Pages --> APIClient
    end

    subgraph ServerLayer ["Camada de Aplicação (Backend Fastify)"]
        FastifyRouter["Fastify HTTP Server & Routing"]
        ZodValidator["Zod Middleware de Validação"]
        Controllers["Domain Controllers (Customers, Technicians, WorkOrders, Metrics)"]
        Services["Business Logic & State Machine Service"]
        FastifyRouter --> ZodValidator
        ZodValidator --> Controllers
        Controllers --> Services
    end

    subgraph DataLayer ["Camada de Persistência (Prisma ORM)"]
        PrismaClient["Prisma Client"]
        SQLiteDB[("SQLite Database (dev.db)")]
        Services --> PrismaClient
        PrismaClient --> SQLiteDB
    end

    APIClient -- "HTTP / REST (JSON)" --> FastifyRouter
```

---

## 🔄 Fluxo de Processamento de uma Ordem de Serviço

O diagrama abaixo ilustra a criação de uma Ordem de Serviço completa com cálculo dinâmico de totais e gravação do primeiro evento na trilha de auditoria:

```mermaid
sequenceDiagram
    autonumber
    actor Operador as Operador / Usuário
    participant Frontend as React Client
    participant API as Fastify Router
    participant Validation as Zod Validator
    participant Service as WorkOrder Service
    participant Database as Prisma / SQLite

    Operador->>Frontend: Preenche formulário de OS e adiciona itens
    Frontend->>Frontend: Calcula totais em tempo real no cliente
    Frontend->>API: POST /work-orders (Payload com cliente, técnico e itens)
    API->>Validation: Valida schema do payload via Zod
    alt Payload Inválido
        Validation-->>Frontend: 400 Bad Request (Lista de erros de campo)
    else Payload Válido
        Validation->>Service: Encaminha dados validados
        Service->>Service: Recalcula totais no backend (segurança financeira)
        Service->>Database: Transação ACID (Cria WorkOrder + WorkOrderItems + StatusHistory)
        Database-->>Service: Registros persistidos com sucesso
        Service-->>API: Objeto consolidado da OS
        API-->>Frontend: 201 Created (Dados da OS + ID gerado)
        Frontend-->>Operador: Exibe confirmação e redireciona para visualização
    end
```
