---
description: Create git commits with user approval and no Claude attribution
---

# Commit Changes

You are tasked with creating git commits for the changes made during this session.

## Process:

1. **Think about what changed:**
   - Review the conversation history and understand what was accomplished
   - Run `git status` to see current changes
   - Run `git diff` to understand the modifications
   - Consider whether changes should be one commit or multiple logical commits

2. **Plan your commit(s):**
   - Identify which files belong together
   - Draft clear, descriptive commit messages
   - Use imperative mood in commit messages (e.g. "Add feature", "Fix bug", not "Added feature")
   - Focus on why the changes were made, not just what
   - Group related changes logically into atomic commits

3. **Present your plan to the user:**
   - List the files you plan to add for each commit
   - Show the commit message(s) you'll use
   - Ask: "I plan to create [N] commit(s) with these changes. Shall I proceed?"

4. **Execute upon confirmation:**
   - Use `git add` with specific files (never use `-A` or `.`)
   - **NEVER commit the `thoughts/` directory or anything inside it!**
   - Run `git reset thoughts/` if staged to ensure no thoughts files are committed
   - Create commits with your planned messages
   - Show the result with `git log --oneline -n [number]`

## Important:
- **NEVER add co-author information or Claude attribution**
- Commits should be authored solely by the user
- Do not include any "Generated with Claude" messages
- Do not add "Co-Authored-By" lines
- Write commit messages as if the user wrote them
- Never commit notes, temporary plan files, or anything in `thoughts/`
- **CRITICAL: TIMEOUT OU ERRO NO MCP NÃO É APROVAÇÃO (FLUXO OPÇÃO 1)!**
  - O usuário tem uma janela de 180 segundos (3 minutos) para clicar nos botões **[ Approve ]** / **[ Deny ]** na Web UI (`http://localhost:1420/`).
  - Se você solicitar aprovação de commit via ferramenta MCP (`codelayer request_approval` ou `request_permission`) e a chamada retornar timeout (`context deadline exceeded`, `timed out after 3m0s`), erro (`TOOL_ERROR`) ou negação (`behavior: "deny"`):
    - Você está **TERMINANTEMENTE PROIBIDO** de realizar o commit ou abrir o PR por conta própria!
    - **NUNCA** assuma aprovação tácita dizendo "como deu timeout, vou commitar direto".
    - **PARE IMEDIATAMENTE** todas as chamadas de ferramentas e encerre o turno.
    - Notifique o usuário no chat:
      > ⏳ **Janela de aprovação interativa da UI expirou (3 minutos)**.
      > Revise com calma o diff e as alterações planejadas para o commit. Quando estiver pronto para prosseguir, basta me responder aqui no chat com **"aprovado"** / **"prossiga"** (para executar o commit diretamente) ou **"reenviar botões"** (para abrir uma nova janela de aprovação na UI).
    - Aguarde a confirmação explícita do usuário antes de prosseguir.

## Remember:
- You have the full context of what was done in this session
- Group related changes together
- Keep commits focused and atomic when possible
- The user trusts your judgment - they asked you to commit

## File Discovery Guidelines
- **CRITICAL**: NEVER execute file search tools (such as `find_by_name` or `list_dir`) with `Pattern: "*"` directly on a root directory containing build/dependency folders (`node_modules/`, `target/`, `dist/`, `.git/`).
- Always specify target source subdirectories (e.g. `backend/src`, `frontend/src`, `thoughts/`) or filter by specific file extensions (`*.java`, `*.ts`, `*.md`, `*.json`).
