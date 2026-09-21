---
description: Execute ralph plan and implementation for a ticket
---


> [!IMPORTANT]
> **ABSOLUTE MANDATORY RULE FOR /create_plan**:
> 1. **PRIMARY GOAL**: The SOLE purpose of `/create_plan` is to write and save the implementation plan markdown file to `thoughts/shared/plans/YYYY-MM-DD-description.md`.
> 2. **MANDATORY FILE CREATION**: As soon as the user confirms the plan structure/scope, you MUST IMMEDIATELY execute `write_to_file` (or write_file) to write the file `thoughts/shared/plans/YYYY-MM-DD-description.md` to disk.
> 3. **NO CODE IMPLEMENTATION**: You MUST NOT modify source code files (Java, TypeScript, Go, etc.), run build scripts, or implement features. Implementing code during `/create_plan` is STRICTLY FORBIDDEN. Code implementation is reserved ONLY for `/implement_plan`.



1. use SlashCommand() to call /ralph_plan with the given ticket number
2. use SlashCommand() to call /ralph_impl with the given ticket number


## File Discovery Guidelines
- **CRITICAL**: NEVER execute file search tools (such as `find_by_name` or `list_dir`) with `Pattern: "*"` directly on a root directory containing build/dependency folders (`node_modules/`, `target/`, `dist/`, `.git/`).
- Always specify target source subdirectories (e.g. `backend/src`, `frontend/src`, `thoughts/`) or filter by specific file extensions (`*.java`, `*.ts`, `*.md`, `*.json`).
