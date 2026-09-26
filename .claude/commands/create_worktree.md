---
description: Create worktree and launch implementation session for a plan with CodeLayer approval
---

1. Determine required data from input/plan:
- Ticket identifier (e.g. `ELI-11` or `ENG-XXXX`)
- Branch name (e.g. `eli-11-feature-name`)
- Relative path to plan file (always starting with `thoughts/shared/plans/...`)
- Repository root name (e.g. `basename $(pwd)`)
- Worktree target path: `~/wt/<repo-name>/<ticket>`

**IMPORTANT PATH USAGE:**
- The `thoughts/` directory is linked between the main repo and worktrees by `hack/create_worktree.sh`.
- Always use ONLY the relative path starting with `thoughts/shared/...` without any directory prefix.
- Example: `thoughts/shared/plans/2026-09-21-ELI-11-backend-api-crud-clientes-validacao-zod.md`.

2. Set up worktree for implementation:
- Run `./hack/create_worktree.sh <TICKET> <BRANCH_NAME>`
- Verify that the worktree and the `thoughts` link were created successfully.

3. Human Approval via CodeLayer Buttons:
- Print a clear, formatted summary in the chat with the worktree path, branch, plan file, and launch command.
- **CRITICAL**: You MUST request explicit user approval before launching the child session.
  - Call the approval tool:
    - **In Antigravity / Agy**: call `call_mcp_tool` with:
      - `ServerName`: `"codelayer"`
      - `ToolName`: `"request_approval"`
      - `Arguments`:
        ```json
        {
          "tool_name": "Launch Implementation Session (<TICKET>)",
          "input": {
            "worktree": "~/wt/<repo-name>/<ticket>",
            "branch": "<BRANCH_NAME>",
            "plan": "<PATH_TO_PLAN>",
            "command": "humanlayer launch --parent-session-id \"$HUMANLAYER_SESSION_ID\" --project-id \"$HUMANLAYER_PROJECT_ID\" --model opus -w ~/wt/<repo-name>/<ticket> \"/implement_plan at <PATH_TO_PLAN> and when you are done implementing and all tests pass, read ./claude/commands/commit.md and create a commit, then read ./claude/commands/describe_pr.md to create the PR, add its description, and link/comment on the Linear ticket via ./hack/linear_comment.sh\""
          },
          "tool_use_id": "launch_session"
        }
        ```
    - **In Claude Code**: call `mcp__codelayer__request_permission` or `request_approval` with:
      ```json
      {
        "tool_name": "Launch Implementation Session (<TICKET>)",
        "input": {
          "worktree": "~/wt/<repo-name>/<ticket>",
          "branch": "<BRANCH_NAME>",
          "plan": "<PATH_TO_PLAN>",
          "command": "humanlayer launch --parent-session-id \"$HUMANLAYER_SESSION_ID\" --project-id \"$HUMANLAYER_PROJECT_ID\" --model opus -w ~/wt/<repo-name>/<ticket> \"/implement_plan at <PATH_TO_PLAN> and when you are done implementing and all tests pass, read ./claude/commands/commit.md and create a commit, then read ./claude/commands/describe_pr.md to create the PR, add its description, and link/comment on the Linear ticket via ./hack/linear_comment.sh\""
        },
        "tool_use_id": "launch_session"
      }
      ```
- **Wait for the user's interactive approval** (the CodeLayer WUI will display the native **[ Approve ]** / **[ Deny ]** buttons).
- Do NOT launch the session or execute the command until the user explicitly approves via the buttons.
- Do NOT ask the user to type or copy/paste the command in text.
- Do NOT use `ask_question` for approvals (it does not create approval buttons and is skipped in headless sessions).
- **CRITICAL: TIMEOUT OU ERRO NO MCP NÃO É APROVAÇÃO (FLUXO OPÇÃO 1)!**
  - O usuário tem uma janela de 180 segundos (3 minutos) para clicar nos botões **[ Approve ]** / **[ Deny ]** na Web UI (`http://localhost:1420/`).
  - Se a ferramenta MCP retornar timeout (`context deadline exceeded`, `timed out after 3m0s`), erro (`TOOL_ERROR`) ou negação (`behavior: "deny"`):
    - Você está **TERMINANTEMENTE PROIBIDO** de lançar a sessão, executar comandos adicionais no terminal ou prosseguir por conta própria.
    - **PARE IMEDIATAMENTE** todas as chamadas de ferramentas e encerre o turno.
    - Emita uma mensagem clara no chat:
      > ⏳ **Janela de aprovação interativa da UI expirou (3 minutos)**.
      > Revise com calma os dados do worktree e plano de implementação. Quando estiver pronto para prosseguir, basta me responder aqui no chat com **"aprovado"** / **"prossiga"** (para eu disparar a sessão diretamente) ou **"reenviar botões"** (para abrir uma nova janela de aprovação na UI).
    - Aguarde a resposta e autorização explícita do usuário antes de realizar qualquer outra ação.

4. Launch Implementation Session:
- Once approved via the tool, execute the launch command:
  ```bash
  humanlayer launch --parent-session-id "$HUMANLAYER_SESSION_ID" --project-id "$HUMANLAYER_PROJECT_ID" --model opus -w ~/wt/<repo-name>/<ticket> "/implement_plan at <PATH_TO_PLAN> and when you are done implementing and all tests pass, read ./claude/commands/commit.md and create a commit, then read ./claude/commands/describe_pr.md to create the PR, add its description, and link/comment on the Linear ticket via ./hack/linear_comment.sh"
  ```
- Parse the resulting Session ID from the command output.
- **CRITICAL**: Print a clear confirmation message with a clickable markdown link to the new child session:
  ```markdown
  ### ✅ Sessão de Implementação Iniciada com Sucesso!

  - **Ticket**: `<TICKET>`
  - **Worktree**: `~/wt/<repo-name>/<ticket>`
  - **Branch**: `<BRANCH_NAME>`
  - **Sessão Filha**: [🔗 Abrir Sessão de Implementação (<TICKET>)](http://localhost:1420/#/sessions/<NEW_SESSION_ID>)
  ```
- The user can click the link above directly from the chat or locate the child session nested under this session in the project sessions list.

## File Discovery Guidelines
- **CRITICAL**: NEVER execute file search tools (such as `find_by_name` or `list_dir`) with `Pattern: "*"` directly on a root directory containing build/dependency folders (`node_modules/`, `target/`, `dist/`, `.git/`).
- Always specify target source subdirectories (e.g. `backend/src`, `frontend/src`, `thoughts/`) or filter by specific file extensions (`*.java`, `*.ts`, `*.md`, `*.json`).
