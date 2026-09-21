---
description: Research ticket and launch planning session
---

1. use SlashCommand() to call /ralph_research with the given ticket number
2. launch a new session with `npx humanlayer launch --model opus --dangerously-skip-permissions --dangerously-skip-permissions-timeout 14m --title "plan TICKET-XXXX" "/oneshot_plan TICKET-XXXX"`


## File Discovery Guidelines
- **CRITICAL**: NEVER execute file search tools (such as `find_by_name` or `list_dir`) with `Pattern: "*"` directly on a root directory containing build/dependency folders (`node_modules/`, `target/`, `dist/`, `.git/`).
- Always specify target source subdirectories (e.g. `backend/src`, `frontend/src`, `thoughts/`) or filter by specific file extensions (`*.java`, `*.ts`, `*.md`, `*.json`).
