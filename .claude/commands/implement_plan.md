---
description: Implement technical plans from thoughts/shared/plans with verification
---


> [!IMPORTANT]
> **ABSOLUTE MANDATORY RULE FOR /create_plan**:
> 1. **PRIMARY GOAL**: The SOLE purpose of `/create_plan` is to write and save the implementation plan markdown file to `thoughts/shared/plans/YYYY-MM-DD-description.md`.
> 2. **MANDATORY FILE CREATION**: As soon as the user confirms the plan structure/scope, you MUST IMMEDIATELY execute `write_to_file` (or write_file) to write the file `thoughts/shared/plans/YYYY-MM-DD-description.md` to disk.
> 3. **NO CODE IMPLEMENTATION**: You MUST NOT modify source code files (Java, TypeScript, Go, etc.), run build scripts, or implement features. Implementing code during `/create_plan` is STRICTLY FORBIDDEN. Code implementation is reserved ONLY for `/implement_plan`.



# Implement Plan

You are tasked with implementing an approved technical plan from `thoughts/shared/plans/`. These plans contain phases with specific changes and success criteria.

## Getting Started

When given a plan path:
- Read the plan completely and check for any existing checkmarks (- [x])
- Read the original ticket and all files mentioned in the plan
- **Read files fully** - never use limit/offset parameters, you need complete context
- Think deeply about how the pieces fit together
- Create a todo list to track your progress
- Start implementing if you understand what needs to be done

If no plan path provided, ask for one.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:
- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Verification Approach

After implementing a phase:
- Run the success criteria checks (usually `make check test` covers everything)
- Fix any issues before proceeding
- Update your progress in both the plan and your todos
- Check off completed items in the plan file itself using Edit
- **Pause for human verification**: After completing all automated verification for a phase, pause and inform the human that the phase is ready for manual testing. Use this format:
  ```
  Phase [N] Complete - Ready for Manual Verification

  Automated verification passed:
  - [List automated checks that passed]

  Please perform the manual verification steps listed in the plan:
  - [List manual verification items from the plan]

  Let me know when manual testing is complete so I can proceed to Phase [N+1].
  ```

If instructed to execute multiple phases consecutively, skip the pause until the last phase. Otherwise, assume you are just doing one phase.

do not check off items in the manual testing steps until confirmed by the user.


## If You Get Stuck

When something isn't working as expected:
- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-tasks sparingly - mainly for targeted debugging or exploring unfamiliar territory.

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.


## File Discovery Guidelines
- **CRITICAL**: NEVER execute file search tools (such as `find_by_name` or `list_dir`) with `Pattern: "*"` directly on a root directory containing build/dependency folders (`node_modules/`, `target/`, `dist/`, `.git/`).
- Always specify target source subdirectories (e.g. `backend/src`, `frontend/src`, `thoughts/`) or filter by specific file extensions (`*.java`, `*.ts`, `*.md`, `*.json`).


> [!IMPORTANT]
> **REGRA MANDATÓRIA DE EXECUÇÃO DE TESTES E TRANSIÇÃO ENTRE FASES (MCP HUMAN APPROVAL)**:
> 1. **Execução Síncrona de Testes**: Ao rodar comandos de verificação e testes (`./mvnw test`, `npx tsc`, `go test`), execute os comandos de forma síncrona (aguardando a conclusão no mesmo turno, passando `WaitMsBeforeAsync: 60000` se necessário) para receber a saída dos testes diretamente no mesmo turno.
> 2. **Relatório Visual no Chat**: Ao confirmar os testes aprovados (`BUILD SUCCESS`), escreva uma mensagem formatada em Markdown no chat exibindo o resumo das alterações e os resultados das suítes de testes da Fase N.
> 3. **Solicitação de Aprovação Nativa HumanLayer (MCP Tool)**: No mesmo turno, invoque a ferramenta MCP `mcp__codelayer__request_permission` (ou `request_approval`) com os argumentos:
>    - `tool_name`: "Aprovação para Início da Fase N+1: <Nome da Fase>"
>    - `input`: {"phase": "N+1", "summary": "Fase N concluída com sucesso.", "next_scope": "Escopo da Fase N+1"}
> 4. **Bloqueio Nativo**: Aguarde a decisão de aprovação do usuário pelo botão **Aprovar** na interface gráfica (aba Timeline & Aprovações). Ao ser aprovado, inicie a Fase N+1 automaticamente.
