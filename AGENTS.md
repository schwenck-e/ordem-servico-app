# Agent Rules — Ordem de Serviço App

## Environment Setup

### Required PATH
When running commands in this workspace, always ensure the following directories are in `PATH`:

```bash
export PATH="/usr/local/bin:/Users/egsl/.bun/bin:/Users/egsl/.nvm/versions/node/v24.14.1/bin:$PATH"
```

This ensures access to:
- **Bun** (`bun`) → `/Users/egsl/.bun/bin/bun`
- **Node v24 / npm** → `/Users/egsl/.nvm/versions/node/v24.14.1/bin/`

---

### Package Manager & Task Execution Rule (CRITICAL)

**Always use `bun` as the package manager and script runner in this workspace.**
- Use `bun install` or `bun add <package>` instead of `npm install` or `yarn`.
- **Rationale**: In headless agent sessions (such as Antigravity CLI `agy`), `npm install` takes >10 seconds and gets automatically moved to a background task, which is killed prematurely when the turn ends. `bun install` runs in ~1-2 seconds, executing 100% synchronously.
- **Rule**: Never end a turn leaving package installation, build, or database migration commands running in background tasks. Always ensure they finish synchronously or wait for their completion.

---

### Common Commands

**From repository root:**
- `bun install` — Install all workspace dependencies
- `bun run --cwd server dev` — Start Fastify server in watch mode
- `bun run --cwd server build` — Compile TypeScript
- `bun run --cwd server typecheck` — Verify TypeScript types (`tsc --noEmit`)

**Inside `server/` directory:**
- `bun install` — Install server dependencies
- `bun run dev` — Run server with hot-reload (`tsx watch src/server.ts`)
- `bun run build` — Build project (`rimraf dist && tsc`)
- `bun run typecheck` — TypeScript typecheck without emitting files
- `bun run prisma:generate` — Generate Prisma Client (`prisma generate`)
- `bun run prisma:migrate` — Run Prisma migrations (`prisma migrate dev`)
- `bun run prisma:studio` — Open Prisma Studio

---

## Architecture Overview

- **Backend (`server/`)**:
  - **Framework**: Fastify 4 (`fastify`, `fastify-plugin`)
  - **Documentation**: Swagger OpenAPI (`@fastify/swagger`, `@fastify/swagger-ui`) exposed at `/documentation`
  - **CORS**: `@fastify/cors`
  - **Database & ORM**: SQLite via Prisma ORM (`prisma`, `@prisma/client`)
  - **Validation & Typing**: Zod (`zod`) + TypeScript (strict mode)
  - **Configuration**: Dotenv (`dotenv`) via `src/config/env.ts`
  - **Logging**: Pino (`pino`, `pino-pretty`)

---

## Coding & Commit Guidelines
- Never commit `.env` or SQLite database files (`*.db`, `*.db-journal`, `*.db-wal`).
- Ensure `bun run typecheck` passes with 0 errors before concluding any implementation.
