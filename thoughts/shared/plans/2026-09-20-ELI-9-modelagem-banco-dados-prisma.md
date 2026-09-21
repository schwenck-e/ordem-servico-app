# ELI-9: Modelagem do Banco de Dados Prisma (Schema, Migrations e Seeds) — Implementation Plan

## Overview

Este plano estabelece a modelagem e persistência relacional do domínio do projeto **Sistema de Gestão de Ordens de Serviço** (`ordem-servico-app`), correspondente ao ticket **[ELI-9](https://linear.app/elima/issue/ELI-9)** (`[Backend] Modelagem do Banco de Dados Prisma (Schema, Migrations e Seeds)`) do épico **[ELI-7](https://linear.app/elima/issue/ELI-7)**.

O objetivo é evoluir o schema Prisma (`server/prisma/schema.prisma`) para contemplar as entidades centrais do sistema (`Customer`, `Technician`, `WorkOrder`, `WorkOrderItem`, `WorkOrderLog`), preservar o modelo operacional `AppHealth`, gerar e aplicar a migração SQLite local (`20260920..._core_domain_entities`), gerar os tipos atualizados do Prisma Client e implementar um script de seed executável (`server/prisma/seed.ts`) populado com registros realistas para clientes, técnicos e ordens de serviço.

---

## Current State Analysis

No estado atual do repositório (`server/` consolidado na branch `eltongomez/eli-8-backend-setup-da-arquitetura-fastify-typescript-prisma`):
- O backend Fastify 4 com TypeScript estrito está funcional, compilando sem erros via `bun run --cwd server typecheck`.
- O schema Prisma (`server/prisma/schema.prisma`) contém unicamente a entidade de infraestrutura `AppHealth`, com a migration `20260920035400_init_health`.
- O banco local SQLite (`server/prisma/dev.db`) está ativo e conectado via Fastify plugin singleton (`server/src/plugins/prisma.ts`).
- O conector SQLite do Prisma impõe restrições arquiteturais:
  - Não possui suporte a `enum` nativo (`Enums are not supported for the SQLite connector`). Status (`OPEN`, `IN_PROGRESS`, `WAITING_PARTS`, `WAITING_APPROVAL`, `COMPLETED`, `CANCELED`), prioridades (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) e tipos de item (`SERVICE`, `PART`) devem ser declarados como `String` no schema Prisma com validação estrita no domínio (TypeScript/Zod).
  - Não possui suporte ao tipo arbitrário `Decimal`. Valores monetários e quantitativos fracionários devem ser mapeados como `Float`.
- Não existem ainda as tabelas de negócio, chaves estrangeiras com regras de deleção (`onDelete`), índices de busca nem script de seed configurado no `server/package.json`.

---

## Desired End State

Ao término da execução deste plano:
1. `server/prisma/schema.prisma` modela completamente as entidades `Customer`, `Technician`, `WorkOrder`, `WorkOrderItem`, `WorkOrderLog` e preserva `AppHealth`.
2. As relações 1:N e regras de integridade referencial estão configuradas:
   - `Customer -> WorkOrder`: `onDelete: Restrict` (impede exclusão de cliente com OS vinculada).
   - `Technician -> WorkOrder`: `onDelete: SetNull` (desassocia técnico sem apagar a OS).
   - `WorkOrder -> WorkOrderItem`: `onDelete: Cascade` (apaga itens ao remover a OS).
   - `WorkOrder -> WorkOrderLog`: `onDelete: Cascade` (apaga histórico ao remover a OS).
3. Índices otimizados criados em campos de chave estrangeira (`customerId`, `technicianId`, `workOrderId`) e campos de filtro frequente (`status`, `priority`).
4. Migração gerada e aplicada com sucesso no SQLite (`server/prisma/migrations/` com novo snapshot).
5. O Prisma Client é gerado e disponibilizado para consumo tipado no singleton do Fastify.
6. Script executável `server/prisma/seed.ts` configurado com `tsx` no `server/package.json`:
   - Popula no mínimo 3 clientes realistas (com CNPJ, CPF, telefones e endereços verossímeis).
   - Popula no mínimo 2 técnicos ativos com especialidades distintas.
   - Popula no mínimo 3 ordens de serviço realistas cobrindo diferentes status (`OPEN`, `IN_PROGRESS`, `COMPLETED`), com itens de serviço/peças, totais calculados e logs de auditoria.
   - É idempotente ou realiza limpeza prévia controlada para viabilizar reexecuções seguras (`bun run --cwd server seed`).
7. Todos os scripts de verificação passam com zero erros (`typecheck`, `seed`, `build`).

---

## What We're NOT Doing

Para manter o foco no escopo de banco de dados e seeds do ticket ELI-9:
- **NÃO** implementar endpoints REST ou rotas CRUD de Clientes, Técnicos ou Ordens de Serviço (escopo de **ELI-11**, **ELI-12**, **ELI-14** e **ELI-15**).
- **NÃO** alterar a arquitetura do Fastify ou criar novos plugins Fastify (já estabelecidos em **ELI-8**).
- **NÃO** implementar frontend React nem telas visuais (escopo de **ELI-10** e subsequentes).
- **NÃO** remover a tabela `AppHealth`, utilizada para validação de integridade pelo endpoint `GET /health`.

---

## Implementation Approach

A execução está estruturada em 4 fases sequenciais:

1. **Fase 1: Modelagem Completa do Schema Prisma** — Atualizar `server/prisma/schema.prisma` com as 5 entidades de domínio, índices e integridade referencial.
2. **Fase 2: Aplicação da Migração SQLite e Geração do Client** — Executar `prisma migrate dev` para registrar a nova migração e gerar as tipagens atualizadas em `@prisma/client`.
3. **Fase 3: Script de Seed e Configuração do Ciclo de Vida** — Criar `server/prisma/seed.ts` com dados realistas e registrar os scripts no `server/package.json` e `package.json` raiz.
4. **Fase 4: Verificação de Integridade, Queries Relacionais e Tipagem** — Executar o seed, validar relacionamentos e integridade via script de teste automatizado e conferir compilação com `bun run typecheck`.

---

## Phase 1: Modelagem Completa do Schema Prisma

### Overview
Expandir `server/prisma/schema.prisma` com todos os modelos, campos, restrições `@unique`, valores padrão `@default`, índices `@@index` e regras de integridade `@relation`.

### Changes Required:

#### 1. `server/prisma/schema.prisma`
**File**: `server/prisma/schema.prisma`  
**Changes**: Adicionar `Customer`, `Technician`, `WorkOrder`, `WorkOrderItem` e `WorkOrderLog`, preservando `AppHealth`.

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

model Customer {
  id        String      @id @default(uuid())
  name      String
  document  String      @unique
  email     String
  phone     String
  address   String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  workOrders WorkOrder[]

  @@map("customers")
}

model Technician {
  id         String      @id @default(uuid())
  name       String
  email      String      @unique
  phone      String
  specialty  String
  isActive   Boolean     @default(true)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  workOrders WorkOrder[]

  @@map("technicians")
}

model WorkOrder {
  id                 String          @id @default(uuid())
  orderNumber        String          @unique
  customerId         String
  technicianId       String?
  equipment          String
  serialNumber       String?
  reportedDefect     String
  technicalDiagnosis String?
  status             String          @default("OPEN")
  priority           String          @default("MEDIUM")
  totalServices      Float           @default(0.0)
  totalParts         Float           @default(0.0)
  discount           Float           @default(0.0)
  totalAmount        Float           @default(0.0)
  scheduledDate      DateTime?
  completedDate      DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  customer           Customer        @relation(fields: [customerId], references: [id], onDelete: Restrict)
  technician         Technician?     @relation(fields: [technicianId], references: [id], onDelete: SetNull)
  items              WorkOrderItem[]
  logs               WorkOrderLog[]

  @@index([customerId])
  @@index([technicianId])
  @@index([status])
  @@index([priority])
  @@map("work_orders")
}

model WorkOrderItem {
  id          String    @id @default(uuid())
  workOrderId String
  type        String    // "SERVICE" | "PART"
  description String
  quantity    Int       @default(1)
  unitPrice   Float     @default(0.0)
  subtotal    Float     @default(0.0)

  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  @@index([workOrderId])
  @@map("work_order_items")
}

model WorkOrderLog {
  id             String    @id @default(uuid())
  workOrderId    String
  previousStatus String?
  newStatus      String
  comment        String?
  createdBy      String    @default("SYSTEM")
  createdAt      DateTime  @default(now())

  workOrder      WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  @@index([workOrderId])
  @@map("work_order_logs")
}
```

### Success Criteria:

#### Automated Verification:
- [x] O arquivo `server/prisma/schema.prisma` é formatado e sintaticamente válido para a CLI do Prisma:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server prisma format
  ```

#### Manual Verification:
- [x] Confirmar visualmente que todos os nomes de tabela mapeados (`@@map`) seguem snake_case (`customers`, `technicians`, `work_orders`, `work_order_items`, `work_order_logs`).

---

## Phase 2: Aplicação da Migração SQLite e Geração do Client

### Overview
Executar a migração via Prisma CLI no SQLite local, gerando os arquivos de migração com controle de versão e gerando o `@prisma/client` com todos os tipos TypeScript.

### Changes Required:

#### 1. Execução de `prisma migrate dev`
**Comando**:
```bash
export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
bun run --cwd server prisma migrate dev --name core_domain_entities
```

Este comando:
- Cria o diretório de migração `server/prisma/migrations/<timestamp>_core_domain_entities/migration.sql`.
- Aplica as tabelas e índices no arquivo `server/prisma/dev.db`.
- Executa `prisma generate` para atualizar as tipagens no `@prisma/client`.

### Success Criteria:

#### Automated Verification:
- [x] Nova pasta de migração criada em `server/prisma/migrations/*_core_domain_entities`:
  ```bash
  test -d server/prisma/migrations/*_core_domain_entities
  ```
- [x] As tabelas foram criadas no banco de dados SQLite local:
  ```bash
  sqlite3 server/prisma/dev.db ".tables" | grep -E 'customers|technicians|work_orders|work_order_items|work_order_logs'
  ```
- [x] A compilação de tipagem do servidor continua íntegra:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server typecheck
  ```

---

## Phase 3: Script de Seed e Configuração do Ciclo de Vida

### Overview
Criar o script TypeScript `server/prisma/seed.ts` utilizando o `PrismaClient` para popular o banco com registros realistas e relacionamentos integrados. Configurar as chamadas de seed no `package.json`.

### Changes Required:

#### 1. `server/prisma/seed.ts`
**File**: `server/prisma/seed.ts`  
**Changes**: Implementar rotina de seed com limpeza controlada e inserção transacional/sequencial de dados consistentes.

Dados a serem criados:
- **Clientes (3 registros)**:
  1. `Silva & Associados Advocacia`: CNPJ `12.345.678/0001-90`, `contato@silvaadv.com.br`, `(11) 3214-5500`, `Av. Paulista, 1000 - Bela Vista, São Paulo - SP`
  2. `Clínica Médica São Lucas`: CNPJ `98.765.432/0001-10`, `suporte@saolucas.med.br`, `(11) 3322-8899`, `Rua Vergueiro, 450 - Paraíso, São Paulo - SP`
  3. `Carlos Eduardo Mendes`: CPF `123.456.789-00`, `carlos.mendes@email.com`, `(11) 98765-4321`, `Rua Domingos de Morais, 1200 - Vila Mariana, São Paulo - SP`
- **Técnicos (2 registros)**:
  1. `Roberto Alves`: `roberto.alves@ordemapp.local`, `(11) 97111-2233`, `Hardware & Microeletrônica`, ativo
  2. `Mariana Costa`: `mariana.costa@ordemapp.local`, `(11) 97222-4455`, `Redes & Infraestrutura`, ativa
- **Ordens de Serviço (3 registros com itens e histórico)**:
  1. `OS-2026-0001`:
     - Cliente: Silva & Associados
     - Técnico: Não atribuído (`null`)
     - Equipamento: `Notebook Dell Latitude 5420` (S/N: `DELL-LAT-9821`)
     - Defeito: `Não liga após pico de energia na tempestade de ontem.`
     - Status: `OPEN`, Prioridade: `HIGH`
     - Itens: 1x Serviço "Diagnóstico técnico e análise da placa-mãe" (R$ 150.00)
     - Totais: Serviços R$ 150.00, Peças R$ 0.00, Desconto R$ 0.00, Total R$ 150.00
     - Logs: Transição inicial para `OPEN` por `SYSTEM`
  2. `OS-2026-0002`:
     - Cliente: Clínica Médica São Lucas
     - Técnico: Roberto Alves
     - Equipamento: `Servidor HP ProLiant MicroServer Gen10` (S/N: `HP-SRV-4412`)
     - Defeito: `Alarme de superaquecimento sonoro e degradação no array RAID.`
     - Diagnóstico: `Falha mecânica em ventoinha auxiliar e setor defeituoso no disco 2.`
     - Status: `IN_PROGRESS`, Prioridade: `URGENT`
     - Itens:
       - 1x Serviço "Desmontagem, limpeza do chassi e substituição de ventoinhas" (R$ 220.00)
       - 2x Peça "Cooler Master Fan Industrial 120mm" (R$ 85.00 cada = R$ 170.00)
       - 1x Peça "Disco Enterprise SAS 2TB Seagate Exos" (R$ 650.00)
     - Totais: Serviços R$ 220.00, Peças R$ 820.00, Desconto R$ 40.00, Total R$ 1000.00
     - Logs:
       - `OPEN` por `SYSTEM`
       - `OPEN` -> `IN_PROGRESS` por `Roberto Alves` ("Iniciada a substituição de cooler e rebuild do storage.")
  3. `OS-2026-0003`:
     - Cliente: Carlos Eduardo Mendes
     - Técnico: Mariana Costa
     - Equipamento: `MacBook Pro 14 M1 (2021)` (S/N: `C02GF389MD6R`)
     - Defeito: `Lentidão extrema e erros frequentes de kernel panic ao inicializar.`
     - Diagnóstico: `Corrupção na partição do sistema de arquivos após queda repentina de energia; reinstalação limpa do macOS Tahoe e bateria recalibrada com sucesso.`
     - Status: `COMPLETED`, Prioridade: `MEDIUM`
     - Agendamento: 2 dias atrás; Conclusão: Hoje
     - Itens:
       - 1x Serviço "Restauração do macOS, backup pontual e validação de hardware" (R$ 350.00)
     - Totais: Serviços R$ 350.00, Peças R$ 0.00, Desconto R$ 0.00, Total R$ 350.00
     - Logs:
       - `OPEN` por `SYSTEM`
       - `OPEN` -> `IN_PROGRESS` por `Mariana Costa`
       - `IN_PROGRESS` -> `WAITING_APPROVAL` por `Mariana Costa` ("Orçamento de formatação enviado via WhatsApp")
       - `WAITING_APPROVAL` -> `IN_PROGRESS` por `SYSTEM` ("Aprovado pelo cliente via telefone")
       - `IN_PROGRESS` -> `COMPLETED` por `Mariana Costa` ("Equipamento pronto para retirada com garantia de 90 dias.")

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpeza prévia na ordem inversa de dependência relacional
  await prisma.workOrderLog.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.customer.deleteMany();

  console.log('🧹 Registros anteriores removidos com sucesso.');

  // 1. Clientes
  const customerLawFirm = await prisma.customer.create({
    data: {
      name: 'Silva & Associados Advocacia',
      document: '12.345.678/0001-90',
      email: 'contato@silvaadv.com.br',
      phone: '(11) 3214-5500',
      address: 'Av. Paulista, 1000, Cj 142 - Bela Vista, São Paulo - SP'
    }
  });

  const customerClinic = await prisma.customer.create({
    data: {
      name: 'Clínica Médica São Lucas',
      document: '98.765.432/0001-10',
      email: 'suporte@saolucas.med.br',
      phone: '(11) 3322-8899',
      address: 'Rua Vergueiro, 450 - Paraíso, São Paulo - SP'
    }
  });

  const customerPerson = await prisma.customer.create({
    data: {
      name: 'Carlos Eduardo Mendes',
      document: '123.456.789-00',
      email: 'carlos.mendes@email.com',
      phone: '(11) 98765-4321',
      address: 'Rua Domingos de Morais, 1200, Apto 54 - Vila Mariana, São Paulo - SP'
    }
  });

  console.log('👥 3 Clientes criados com sucesso.');

  // 2. Técnicos
  const techRoberto = await prisma.technician.create({
    data: {
      name: 'Roberto Alves',
      email: 'roberto.alves@ordemapp.local',
      phone: '(11) 97111-2233',
      specialty: 'Hardware & Microeletrônica',
      isActive: true
    }
  });

  const techMariana = await prisma.technician.create({
    data: {
      name: 'Mariana Costa',
      email: 'mariana.costa@ordemapp.local',
      phone: '(11) 97222-4455',
      specialty: 'Redes & Infraestrutura',
      isActive: true
    }
  });

  console.log('🔧 2 Técnicos criados com sucesso.');

  // 3. Ordens de Serviço
  // OS 1: ABERTA (Sem técnico atribuído ainda)
  await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0001',
      customerId: customerLawFirm.id,
      equipment: 'Notebook Dell Latitude 5420',
      serialNumber: 'DELL-LAT-9821',
      reportedDefect: 'Não liga após oscilação de energia elétrica no escritório.',
      status: 'OPEN',
      priority: 'HIGH',
      totalServices: 150.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 150.0,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Diagnóstico técnico inicial e análise de curto na placa-mãe',
            quantity: 1,
            unitPrice: 150.0,
            subtotal: 150.0
          }
        ]
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'Ordem de serviço registrada pelo canal de atendimento corporativo.',
            createdBy: 'SYSTEM'
          }
        ]
      }
    }
  });

  // OS 2: EM ANDAMENTO (Atribuída ao Roberto com peças e serviços)
  await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0002',
      customerId: customerClinic.id,
      technicianId: techRoberto.id,
      equipment: 'Servidor HP ProLiant MicroServer Gen10',
      serialNumber: 'HP-SRV-4412',
      reportedDefect: 'Alarme de superaquecimento sonoro e degradação de performance no array RAID.',
      technicalDiagnosis: 'Falha mecânica em ventoinha primária e bloco defeituoso no disco 2.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      totalServices: 220.0,
      totalParts: 820.0,
      discount: 40.0,
      totalAmount: 1000.0,
      scheduledDate: new Date(),
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Desmontagem, limpeza do chassi térmico e reinstalação de ventoinhas',
            quantity: 1,
            unitPrice: 220.0,
            subtotal: 220.0
          },
          {
            type: 'PART',
            description: 'Cooler Master Fan Industrial 120mm PWM',
            quantity: 2,
            unitPrice: 85.0,
            subtotal: 170.0
          },
          {
            type: 'PART',
            description: 'Disco Enterprise SAS 2TB Seagate Exos',
            quantity: 1,
            unitPrice: 650.0,
            subtotal: 650.0
          }
        ]
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'OS aberta com prioridade de emergência para servidor de prontuários médicos.',
            createdBy: 'SYSTEM'
          },
          {
            previousStatus: 'OPEN',
            newStatus: 'IN_PROGRESS',
            comment: 'Iniciada a substituição do cooler e rebuild do array RAID no laboratório.',
            createdBy: techRoberto.name
          }
        ]
      }
    }
  });

  // OS 3: CONCLUÍDA (Mariana Costa finalizou atendimento com diagnóstico completo)
  const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const finishDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

  await prisma.workOrder.create({
    data: {
      orderNumber: 'OS-2026-0003',
      customerId: customerPerson.id,
      technicianId: techMariana.id,
      equipment: 'MacBook Pro 14 M1 (2021)',
      serialNumber: 'C02GF389MD6R',
      reportedDefect: 'Lentidão extrema e erros de kernel panic ao inicializar.',
      technicalDiagnosis: 'Corrupção no APFS decorrente de desligamento abrupto; reinstalação limpa do macOS e bateria testada OK.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      totalServices: 350.0,
      totalParts: 0.0,
      discount: 0.0,
      totalAmount: 350.0,
      scheduledDate: pastDate,
      completedDate: finishDate,
      items: {
        create: [
          {
            type: 'SERVICE',
            description: 'Restauração do macOS, backup de perfil de usuário e diagnóstico de hardware',
            quantity: 1,
            unitPrice: 350.0,
            subtotal: 350.0
          }
        ]
      },
      logs: {
        create: [
          {
            previousStatus: null,
            newStatus: 'OPEN',
            comment: 'Recebido na recepção para análise em balcão.',
            createdBy: 'SYSTEM'
          },
          {
            previousStatus: 'OPEN',
            newStatus: 'IN_PROGRESS',
            comment: 'Iniciado teste de estresse de memória e SSD.',
            createdBy: techMariana.name
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'WAITING_APPROVAL',
            comment: 'Orçamento de restauração enviado para o cliente por WhatsApp.',
            createdBy: techMariana.name
          },
          {
            previousStatus: 'WAITING_APPROVAL',
            newStatus: 'IN_PROGRESS',
            comment: 'Orçamento autorizado pelo cliente.',
            createdBy: 'SYSTEM'
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'COMPLETED',
            comment: 'Instalação concluída com sucesso e equipamento pronto para entrega com garantia.',
            createdBy: techMariana.name
          }
        ]
      }
    }
  });

  console.log('📋 3 Ordens de Serviço populadas com itens e histórico de logs.');
  console.log('✨ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed do banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 2. Atualização de `server/package.json`
**File**: `server/package.json`  
**Changes**: Adicionar chave `"prisma": { "seed": "tsx prisma/seed.ts" }` e script `"seed": "prisma db seed"`.

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
    "seed": "prisma db seed",
    "typecheck": "tsc --noEmit"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  ...
}
```

#### 3. Atualização de `package.json` (Raiz)
**File**: `package.json`  
**Changes**: Adicionar script de atalho `"seed:server": "npm run seed --workspace=server"`.

### Success Criteria:

#### Automated Verification:
- [x] Execução do script de seed com sucesso pelo Prisma:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server seed
  ```
- [x] O seed é reexecutável (idempotente) sem falhar por violação de constraint `@unique`:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server seed
  ```

---

## Phase 4: Verificação de Integridade, Queries Relacionais e Tipagem

### Overview
Validar que os dados populados pelo seed atendem aos requisitos funcionais do ticket ELI-9, testar integridade referencial via script TypeScript e certificar que a aplicação continua construindo e executando perfeitamente.

### Changes Required:

#### 1. Script de Verificação Automatizada
Executar script rápido (utilizando `tsx`) para inspecionar os registros e relações:
- Contar `Customer` (>= 3).
- Contar `Technician` (>= 2).
- Contar `WorkOrder` (>= 3).
- Validar joins relacionais: buscar `WorkOrder` com `customer`, `technician`, `items` e `logs` em consulta única.

#### 2. Validação da API e Integridade Geral
- Rodar `bun run --cwd server typecheck`
- Rodar `bun run --cwd server build`
- Inicializar temporariamente o servidor e testar `GET /health` garantindo que o SQLite continua conectado e respondendo `200 OK`.

### Success Criteria:

#### Automated Verification:
- [x] Verificação de contagem de registros do seed:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server tsx -e "
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  async function test() {
    const c = await prisma.customer.count();
    const t = await prisma.technician.count();
    const wo = await prisma.workOrder.count();
    const items = await prisma.workOrderItem.count();
    const logs = await prisma.workOrderLog.count();
    console.log({ customers: c, technicians: t, workOrders: wo, items, logs });
    if (c < 3 || t < 2 || wo < 3 || items < 3 || logs < 3) throw new Error('Contagem insuficiente de registros no seed');
  }
  test().finally(() => prisma.\$disconnect());
  "
  ```
- [x] Verificação de integridade relacional profunda:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server tsx -e "
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  async function test() {
    const orders = await prisma.workOrder.findMany({
      include: { customer: true, technician: true, items: true, logs: true }
    });
    for (const order of orders) {
      if (!order.customer) throw new Error('Ordem sem cliente vinculado');
      if (order.items.length === 0) throw new Error('Ordem sem itens vinculados');
      if (order.logs.length === 0) throw new Error('Ordem sem histórico de logs');
    }
    console.log('✅ Integridade relacional validada com sucesso.');
  }
  test().finally(() => prisma.\$disconnect());
  "
  ```
- [x] Validação estrita de TypeScript:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server typecheck
  ```
- [x] Verificação de compilação:
  ```bash
  export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
  bun run --cwd server build
  ```

#### Manual Verification:
- [ ] Executar `bun run --cwd server prisma:studio` se desejado pelo desenvolvedor para conferência visual das tabelas no navegador.
- [x] Verificar que `GET /health` responde normalmente com o banco conectado.

---

## Testing Strategy

### Database Schema & Migration:
- Verificação de constraint única: tentar inserir dois clientes com o mesmo `document` ou dois técnicos com o mesmo `email` deve disparar erro `P2002` do Prisma.
- Verificação de integridade referencial: tentar deletar um cliente com ordem de serviço ativa deve disparar restrição `P2003` (`onDelete: Restrict`).
- Deleção em cascata: deletar uma ordem de serviço isolada deve remover automaticamente seus `WorkOrderItem` e `WorkOrderLog`.

### Seeds:
- O seed deve ser determinístico e reutilizável, executável a qualquer momento com `bun run --cwd server seed` sem corromper o banco nem duplicar registros.

---

## Performance Considerations

- Índices `@@index` adicionados explicitamente no schema Prisma para chaves estrangeiras (`customerId`, `technicianId`, `workOrderId`) e filtros de consulta frequentes (`status`, `priority`). Isso previne *full table scans* quando a base de ordens de serviço crescer.
- SQLite opera em arquivo local com modo WAL habilitado pelo runtime, suportando leituras simultâneas para testes e homologação sem concorrência destrutiva.

---

## Migration Notes

- A migração inicial `20260920035400_init_health` é preservada intacta no histórico.
- A nova migração registrará a adição das tabelas `customers`, `technicians`, `work_orders`, `work_order_items`, `work_order_logs` e seus respectivos índices e chaves estrangeiras.
- Não há perda de dados ou migração destrutiva, pois as tabelas de negócio são novas adições.

---

## References

- Ticket Linear: [ELI-9](https://linear.app/elima/issue/ELI-9) (`[Backend] Modelagem do Banco de Dados Prisma (Schema, Migrations e Seeds)`)
- Épico Linear: [ELI-7](https://linear.app/elima/issue/ELI-7) (`[ÉPICO] Sistema de Gestão de Ordens de Serviço`)
- Research Document: [`thoughts/shared/research/2026-09-20-ELI-9-modelagem-banco-dados-prisma.md`](file:///Users/egsl/Documents/ordem-servico-app/thoughts/shared/research/2026-09-20-ELI-9-modelagem-banco-dados-prisma.md)
- Backlog Consolidado: [`thoughts/shared/research/2026-09-15-ordem-servico-backlog.md`](file:///Users/egsl/Documents/ordem-servico-app/thoughts/shared/research/2026-09-15-ordem-servico-backlog.md)
- Plano Anterior: [`thoughts/shared/plans/2026-09-19-ELI-8-backend-architecture-setup.md`](file:///Users/egsl/Documents/ordem-servico-app/thoughts/shared/plans/2026-09-19-ELI-8-backend-architecture-setup.md)
