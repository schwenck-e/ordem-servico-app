# ELI-10: Setup do React Vite + Tailwind CSS + Roteamento e API Client — Implementation Plan

## Overview

Este plano estabelece a infraestrutura fundacional da camada de frontend para o projeto **Sistema de Gestão de Ordens de Serviço** (`ordem-servico-app`), correspondente ao ticket **[ELI-10](https://linear.app/elima/issue/ELI-10)** (`[Frontend] Setup do React Vite + Tailwind CSS + Roteamento e API Client`) do épico **[ELI-7](https://linear.app/elima/issue/ELI-7)**.

O objetivo é estruturar o subdiretório `client/` como um workspace integrado do monorepo, utilizando **React 18/19**, **Vite**, **TypeScript** em modo estrito, **Tailwind CSS** com PostCSS/Autoprefixer, ícones do **Lucide React**, gerenciamento de estado de servidor com **TanStack Query (React Query v5)**, roteamento declarativo com **React Router DOM v6**, layout base responsivo com Sidebar expansível e Header, e um cliente HTTP modular configurado para comunicar-se com a API Fastify (`http://localhost:3333`).

---

## Current State Analysis

No estado atual do repositório (`5d8d5c7` na branch `eli-9-database-model`):
- O backend Fastify está completamente configurado em `server/` (ticket **ELI-8**), com documentação OpenAPI Swagger e endpoint `GET /health`.
- O banco de dados relacional SQLite e o schema Prisma com migrações e seeds estão operacionais (ticket **ELI-9**).
- O backend já expõe CORS permitindo `http://localhost:5173` (definido em `server/src/config/env.ts` e `server/src/plugins/cors.ts`).
- O diretório `client/` **ainda não existe**.
- O arquivo raiz `package.json` lista apenas `"server"` no array de `workspaces`, carecendo de scripts facilitadores para o frontend (`dev:client`, `build:client`, `typecheck:client`, `dev:all`).

---

## Desired End State

Ao término da execução deste plano:
1. O diretório `client/` estará criado e estruturado com TypeScript estrito, sem advertências ou erros de tipagem (`bun run --cwd client typecheck` passa com 0 erros).
2. O arquivo raiz `package.json` conterá `"client"` no array de workspaces e scripts integrados de compilação, typecheck e execução de desenvolvimento.
3. O Tailwind CSS estará configurado com fontes de sistema modernas, paleta de cores consistente (slate/indigo/emerald/amber/rose), utilitários e regras de reset em `client/src/index.css`.
4. O `react-router-dom` estará configurado com um layout mestre persistente (`AppLayout`), contendo:
   - **Sidebar**: Navegação lateral com links ativos destacados, ícones Lucide e indicador de versão.
   - **Header**: Barra superior com título da tela atual, indicador de status de conexão com a API e perfil do operador.
   - **Main Content**: Região dinâmica renderizada através do `<Outlet />`.
5. As seguintes rotas estarão mapeadas:
   - `/` — `DashboardPage` (visão geral, cartões de boas-vindas e status da conexão com a API Fastify).
   - `/work-orders` — `WorkOrdersPage` (placeholder estruturado para ELI-16).
   - `/customers` — `CustomersPage` (placeholder estruturado para ELI-13).
   - `/technicians` — `TechniciansPage` (placeholder estruturado para ELI-13).
   - `*` — `NotFoundPage` (tela de rota não encontrada amigável).
6. O **TanStack Query v5** (`@tanstack/react-query`) estará instanciado globalmente em `client/src/main.tsx`, com retry e staleTime configurados de forma resiliente.
7. O cliente HTTP modular em `client/src/lib/api.ts` estará implementado usando `fetch` nativo com tratamento padronizado de erros, base URL (`http://localhost:3333` ou variável `VITE_API_URL`) e tipagem TypeScript genérica.
8. Um hook de integração `useHealth` consumirá `GET /health` da API Fastify, permitindo verificar a comunicação fullstack em tempo real na tela inicial.
9. Os comandos de build (`bun run --cwd client build`) e checagem de tipos (`bun run --cwd client typecheck`) executarão com sucesso.

---

## What We're NOT Doing

Para manter o escopo estritamente delimitado aos requisitos de fundação do ticket ELI-10:
- **NÃO** implementar os formulários e tabelas CRUD de clientes ou técnicos (escopo dedicado de **ELI-13**).
- **NÃO** implementar a visualização em Kanban, tabela avançada ou filtros complexos de ordens de serviço (escopo de **ELI-16**).
- **NÃO** implementar o formulário de abertura e cálculo de itens da OS (escopo de **ELI-17**).
- **NÃO** implementar a timeline de auditoria nem o layout de impressão/PDF da OS (escopo de **ELI-18**).
- **NÃO** implementar gráficos estatísticos ou dashboards com métricas agregadas (escopo de **ELI-20**).
- **NÃO** adicionar bibliotecas de UI infladas ou de componentes pesados (como Material UI, Ant Design ou Chakra UI), preservando Tailwind CSS utilitário com `lucide-react` e `clsx`/`tailwind-merge`.

---

## Implementation Approach

A execução está estruturada em 5 fases sequenciais e complementares:

1. **Fase 1: Configuração do Workspace Monorepo e Pacote `client/`** — Registrar workspace no `package.json` raiz, criar estrutura de arquivos base, `package.json`, `tsconfig.json`, `tsconfig.node.json` e `vite.config.ts`.
2. **Fase 2: Instalação de Dependências e Configuração do Tailwind CSS** — Instalar dependências via `bun install`, configurar `tailwind.config.js`, `postcss.config.js`, utilitário `cn` (`clsx` + `tailwind-merge`) e diretivas globais em `src/index.css`.
3. **Fase 3: Camada de Rede, TanStack Query e Tipagens** — Criar `src/lib/api.ts`, tipagens em `src/types/index.ts`, e hook `useHealth.ts` para validação imediata do backend.
4. **Fase 4: Sistema de Layout, Componentes Base e Roteamento** — Implementar `Sidebar`, `Header`, `AppLayout`, `Badge`, `App.tsx` com `createBrowserRouter` / `RouterProvider` ou `BrowserRouter`, e as páginas `DashboardPage`, `WorkOrdersPage`, `CustomersPage`, `TechniciansPage` e `NotFoundPage`.
5. **Fase 5: Verificação, Build e Teste de Integração Fullstack** — Executar validações estáticas (`typecheck`, `build`), verificar o carregamento de rotas e o consumo do endpoint `GET /health` da API Fastify.

---

## Phase 1: Configuração do Workspace Monorepo e Pacote `client/`

### Overview
Integrar o pacote `client` na raiz do monorepo e configurar as ferramentas essenciais de compilação (Vite + TypeScript).

### Changes Required:

#### 1. `package.json` (Raiz)
**File**: `package.json`  
**Changes**: Adicionar `"client"` no array `workspaces` e incluir scripts facilitadores para desenvolvimento, build e checagem de tipos do frontend.

```json
{
  "name": "ordem-servico-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "dev:server": "bun run --cwd server dev",
    "build:server": "bun run --cwd server build",
    "seed:server": "bun run --cwd server seed",
    "typecheck:server": "bun run --cwd server typecheck",
    "dev:client": "bun run --cwd client dev",
    "build:client": "bun run --cwd client build",
    "typecheck:client": "bun run --cwd client typecheck",
    "typecheck": "bun run typecheck:server && bun run typecheck:client",
    "build": "bun run build:server && bun run build:client"
  },
  "devDependencies": {}
}
```

#### 2. `client/package.json`
**File**: `client/package.json`  
**Changes**: Criar a definição de pacote com as dependências do React, Vite, Tailwind CSS, Lucide React, TanStack Query e React Router DOM.

```json
{
  "name": "client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.67.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.2",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.2.0"
  }
}
```

#### 3. `client/tsconfig.json` & `client/tsconfig.node.json`
**File**: `client/tsconfig.json`  
**Changes**: Configuração estrita de TypeScript para o ambiente de browser com React JSX e resolução de caminhos (`@/*` apontando para `./src/*`).

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting e Tipagem Estrita */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Alias de caminhos */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**File**: `client/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### 4. `client/vite.config.ts`
**File**: `client/vite.config.ts`  
**Changes**: Configuração do Vite com suporte ao plugin React, alias `@` para resolução de caminhos, e proxy ou porta padrão (`5173`).

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

#### 5. `client/index.html`
**File**: `client/index.html`  
**Changes**: Template HTML principal com metadados da aplicação, viewport responsiva e inclusão de fonte Inter/Sans.

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sistema de Gestão de Ordens de Serviço</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Phase 2: Estilização com Tailwind CSS e Utilitários

### Overview
Configurar o pipeline de estilização utilitária com Tailwind CSS v3, PostCSS, Autoprefixer, paleta personalizada e utilitário `cn` para composição de classes.

### Changes Required:

#### 1. `client/postcss.config.js`
**File**: `client/postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

#### 2. `client/tailwind.config.js`
**File**: `client/tailwind.config.js`  
**Changes**: Mapeamento dos arquivos fonte em `src/`, extensão de fontes com família `Inter` e paleta de cores com suporte a status de OS (`open`, `in-progress`, `waiting`, `completed`, `canceled`).

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
    },
  },
  plugins: [],
};
```

#### 3. `client/src/index.css`
**File**: `client/src/index.css`  
**Changes**: Inclusão das diretivas `@tailwind` e estilos base de scroll e layout.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans bg-slate-50 text-slate-900 min-h-screen;
  }
}
```

#### 4. `client/src/lib/utils.ts`
**File**: `client/src/lib/utils.ts`  
**Changes**: Utilitário canônico `cn` combinando `clsx` e `tailwind-merge` para estilização condicional segura.

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateString));
}
```

---

## Phase 3: Camada de Rede, TanStack Query e Tipagens Compartilhadas

### Overview
Implementar o cliente HTTP desacoplado com base URL da API Fastify, suporte a erros HTTP estruturados, tipagens de entidades e hook para testar conectividade.

### Changes Required:

#### 1. `client/src/types/index.ts`
**File**: `client/src/types/index.ts`  
**Changes**: Definição dos tipos centrais que espelham os dados da API Fastify (`WorkOrder`, `Customer`, `Technician`, `HealthResponse`).

```typescript
export type WorkOrderStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderItemType = 'SERVICE' | 'PART';

export interface CustomerSummary {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string | null;
}

export interface TechnicianSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string | null;
  active: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
  };
}
```

#### 2. `client/src/lib/api.ts`
**File**: `client/src/lib/api.ts`  
**Changes**: Wrapper de requisições HTTP padronizado com baseURL apontando para `http://localhost:3333` (com fallback via `import.meta.env.VITE_API_URL`), headers JSON e conversão de erros.

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const config: RequestInit = {
    method: customConfig.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorPayload: unknown;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = await response.text();
    }
    const message =
      typeof errorPayload === 'object' && errorPayload !== null && 'message' in errorPayload
        ? String((errorPayload as { message: unknown }).message)
        : `Erro na requisição: ${response.status} ${response.statusText}`;

    throw new ApiError(message, response.status, errorPayload);
  }

  // Resposta 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
```

#### 3. `client/src/hooks/useHealth.ts`
**File**: `client/src/hooks/useHealth.ts`  
**Changes**: Hook baseado em TanStack Query para consultar o endpoint de saúde do backend e fornecer status de conectividade em tempo real.

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { HealthResponse } from '@/types';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient<HealthResponse>('/health'),
    refetchInterval: 30000, // Checagem a cada 30 segundos
    retry: 2,
  });
}
```

---

## Phase 4: Sistema de Layout, Componentes Base e Roteamento

### Overview
Implementar a arquitetura visual composta por Sidebar de navegação, Header superior com indicador de status, componente Badge para feedbacks de estado e páginas iniciais correspondentes às rotas centrais.

### Changes Required:

#### 1. `client/src/components/common/Badge.tsx`
**File**: `client/src/components/common/Badge.tsx`  
**Changes**: Componente reutilizável de etiqueta para status de ordens de serviço e conectividade do sistema.

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import type { WorkOrderStatus, WorkOrderPriority } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-300',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: WorkOrderStatus }> = ({ status }) => {
  const map: Record<WorkOrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
    OPEN: { label: 'Aberta', variant: 'info' },
    IN_PROGRESS: { label: 'Em Andamento', variant: 'warning' },
    WAITING_PARTS: { label: 'Aguardando Peças', variant: 'warning' },
    WAITING_APPROVAL: { label: 'Aguardando Aprovação', variant: 'neutral' },
    COMPLETED: { label: 'Concluída', variant: 'success' },
    CANCELED: { label: 'Cancelada', variant: 'danger' },
  };

  const config = map[status] || { label: status, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const PriorityBadge: React.FC<{ priority: WorkOrderPriority }> = ({ priority }) => {
  const map: Record<WorkOrderPriority, { label: string; variant: BadgeProps['variant'] }> = {
    LOW: { label: 'Baixa', variant: 'neutral' },
    MEDIUM: { label: 'Média', variant: 'info' },
    HIGH: { label: 'Alta', variant: 'warning' },
    URGENT: { label: 'Urgente', variant: 'danger' },
  };

  const config = map[priority] || { label: priority, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
```

#### 2. `client/src/components/layout/Sidebar.tsx`
**File**: `client/src/components/layout/Sidebar.tsx`  
**Changes**: Menu lateral com logotipo, navegação por ícones (Dashboard, Ordens de Serviço, Clientes, Técnicos) e indicação visual de rota ativa usando `NavLink`.

```typescript
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ordens de Serviço', href: '/work-orders', icon: ClipboardList },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Técnicos', href: '/technicians', icon: Wrench },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
        <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            Gestão de O.S.
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Painel Operacional</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
        <p className="font-medium text-slate-500">Ordem de Serviço v1.0</p>
        <p className="mt-0.5">Fastify + React Monorepo</p>
      </div>
    </aside>
  );
};
```

#### 3. `client/src/components/layout/Header.tsx`
**File**: `client/src/components/layout/Header.tsx`  
**Changes**: Barra superior contendo breadcrumb/título contextual, indicador do status da API (`useHealth`) e perfil de usuário.

```typescript
import React from 'react';
import { Activity, Server } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';

export const Header: React.FC = () => {
  const { data: health, isLoading, isError } = useHealth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      {/* Title / Breadcrumb Placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Sistema</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800">Visão Geral</span>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Backend API Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">API:</span>
          {isLoading ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
              Conectando...
            </span>
          ) : isError ? (
            <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Desconectada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Online {health?.database?.status === 'connected' && '(DB OK)'}
            </span>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
            OP
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Operador</p>
            <p className="text-[10px] text-slate-400">Atendimento</p>
          </div>
        </div>
      </div>
    </header>
  );
};
```

#### 4. `client/src/components/layout/AppLayout.tsx`
**File**: `client/src/components/layout/AppLayout.tsx`  
**Changes**: Shell principal que acomoda Sidebar, Header e `<Outlet />` para transições de páginas fluidas sem recarregamento.

```typescript
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

#### 5. Páginas Base: `DashboardPage`, `WorkOrdersPage`, `CustomersPage`, `TechniciansPage`, `NotFoundPage`

**File**: `client/src/pages/DashboardPage.tsx`  
**Changes**: Página inicial com resumo dos módulos, card de status do sistema e atalhos rápidos.

```typescript
import React from 'react';
import { ClipboardList, Users, Wrench, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHealth } from '@/hooks/useHealth';

export const DashboardPage: React.FC = () => {
  const { data: health, isLoading, isError } = useHealth();

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Operacional</h2>
        <p className="text-sm text-slate-500 mt-1">
          Bem-vindo ao Sistema de Gestão de Ordens de Serviço.
        </p>
      </div>

      {/* Cartão de Status do Backend / Infra */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Status dos Serviços Integrados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Fastify Backend</span>
            <span className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              {isLoading ? (
                'Verificando...'
              ) : isError ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Indisponível
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Porta 3333 Conectada
                </span>
              )}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Banco de Dados SQLite</span>
            <span className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              {health?.database?.status === 'connected' ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Prisma Conectado
                </span>
              ) : (
                <span className="text-slate-500">Aguardando backend</span>
              )}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block">Frontend Runtime</span>
            <span className="text-sm font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Vite + React 18 + Tailwind
            </span>
          </div>
        </div>
      </div>

      {/* Acesso Rápido aos Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/work-orders"
          className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
            Ordens de Serviço
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Abertura, acompanhamento de status em tabela e Kanban, cálculo de peças e serviços.
          </p>
        </Link>

        <Link
          to="/customers"
          className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
            Clientes
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Cadastro de pessoas físicas e jurídicas, telefones de contato e histórico de atendimentos.
          </p>
        </Link>

        <Link
          to="/technicians"
          className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
            Técnicos
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Gestão da equipe de execução, especialidades técnicas e atribuição de responsabilidades.
          </p>
        </Link>
      </div>
    </div>
  );
};
```

**File**: `client/src/pages/WorkOrdersPage.tsx`  
**Changes**: Placeholder para a tela de Ordens de Serviço (preparando o terreno para ELI-16 e ELI-17).
```typescript
import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';

export const WorkOrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ordens de Serviço</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie o ciclo de vida dos atendimentos técnicos e manutenções.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg opacity-75 cursor-not-allowed shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <ClipboardList className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Módulo de Ordens de Serviço</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          A visualização em tabela e Kanban será disponibilizada no ticket <strong>ELI-16</strong> e a criação completa em <strong>ELI-17</strong>.
        </p>
      </div>
    </div>
  );
};
```

**File**: `client/src/pages/CustomersPage.tsx`  
**Changes**: Placeholder para a tela de Clientes (preparando para ELI-13).
```typescript
import React from 'react';
import { Users, Plus } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Base de clientes, contratos e histórico de ordens vinculadas.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg opacity-75 cursor-not-allowed shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Módulo de Clientes</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Tabelas com paginação e formulários de cadastro com validação serão implementados no ticket <strong>ELI-13</strong>.
        </p>
      </div>
    </div>
  );
};
```

**File**: `client/src/pages/TechniciansPage.tsx`  
**Changes**: Placeholder para a tela de Técnicos (preparando para ELI-13).
```typescript
import React from 'react';
import { Wrench, Plus } from 'lucide-react';

export const TechniciansPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Técnicos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Equipe técnica, especialidades e disponibilidade de alocação.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg opacity-75 cursor-not-allowed shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Técnico
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Wrench className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Módulo de Técnicos</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Gestão de técnicos, especialidades e status ativo/inativo serão implementados no ticket <strong>ELI-13</strong>.
        </p>
      </div>
    </div>
  );
};
```

**File**: `client/src/pages/NotFoundPage.tsx`  
**Changes**: Tela amigável de erro 404 para rotas não mapeadas.
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Página Não Encontrada</h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
        O endereço solicitado não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
      >
        <Home className="w-4 h-4" />
        Voltar para o Dashboard
      </Link>
    </div>
  );
};
```

#### 6. `client/src/App.tsx`
**File**: `client/src/App.tsx`  
**Changes**: Configuração central do roteamento com `BrowserRouter`, rotas aninhadas dentro de `AppLayout` e rota coringa `*`.

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { TechniciansPage } from '@/pages/TechniciansPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/technicians" element={<TechniciansPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

#### 7. `client/src/main.tsx`
**File**: `client/src/main.tsx`  
**Changes**: Inicialização do React DOM com `QueryClientProvider` configurado globalmente.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## Phase 5: Verificação, Build e Teste de Integração Fullstack

### Overview
Executar instalação sincronizada via Bun, checagem de tipos estrita do TypeScript, compilação de produção com Vite e teste de integração do fluxo completo.

### Steps:

1. **Instalação das dependências do workspace**:
   ```bash
   export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
   bun install
   ```
2. **Checagem de tipagem estrita no Frontend**:
   ```bash
   bun run --cwd client typecheck
   ```
   *Critério de aceitação*: 0 erros do compilador `tsc`.
3. **Build de produção com Vite**:
   ```bash
   bun run --cwd client build
   ```
   *Critério de aceitação*: Diretório `client/dist/` gerado com arquivos JS/CSS otimizados.
4. **Validação da compilação unificada do Monorepo**:
   ```bash
   bun run typecheck
   ```
   *Critério de aceitação*: Tanto `server` quanto `client` compilam com 100% de sucesso.
5. **Teste de Integração de Rede (Backend + Frontend Client)**:
   - Rodar script de verificação simulado que executa o `apiClient` contra o backend Fastify ativo ou valida os tipos e contratos exportados.

---

## Definition of Done (DoD) Checklist

- [ ] Workspace `"client"` devidamente registrado em `package.json` raiz com scripts `dev:client`, `build:client` e `typecheck:client`.
- [ ] Aplicação React Vite criada e configurada com TypeScript em modo estrito (`strict: true`).
- [ ] Tailwind CSS configurado com PostCSS, Autoprefixer, utilitário `cn` e paleta consistente.
- [ ] Layout base operacional com `Sidebar`, `Header` e área principal (`<Outlet />`).
- [ ] Rotas declaradas no `App.tsx` para `/`, `/work-orders`, `/customers`, `/technicians` e `*`.
- [ ] TanStack Query configurado globalmente no topo da aplicação com `QueryClientProvider`.
- [ ] Cliente HTTP (`apiClient`) criado em `src/lib/api.ts` com suporte a erros tipados e baseURL do backend.
- [ ] Hook `useHealth` consumindo a rota `GET /health` e exibindo status de conexão na UI.
- [ ] `bun run --cwd client typecheck` executando com zero erros.
- [ ] `bun run --cwd client build` gerando bundle estático em `client/dist/` com sucesso.
