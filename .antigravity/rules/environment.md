# Environment and Command Execution Rules

## Package Management
- Always use `bun` as the package manager and runner in this repository (`bun install`, `bun add`, `bun run <script>`).
- Do NOT use `npm install`.

## Headless Execution & Background Tasks
- Never finish your turn while critical operations (like dependency installation, Prisma generation, or builds) are running as background tasks.
- If a command is sent to the background, check its status or logs and do not conclude the session as completed until the essential commands have finished.
