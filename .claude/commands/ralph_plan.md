---
description: Create implementation plan for highest priority Linear ticket ready for spec
---


> [!IMPORTANT]
> **ABSOLUTE MANDATORY RULE FOR /create_plan**:
> 1. **PRIMARY GOAL**: The SOLE purpose of `/create_plan` is to write and save the implementation plan markdown file to `thoughts/shared/plans/YYYY-MM-DD-description.md`.
> 2. **MANDATORY FILE CREATION**: As soon as the user confirms the plan structure/scope, you MUST IMMEDIATELY execute `write_to_file` (or write_file) to write the file `thoughts/shared/plans/YYYY-MM-DD-description.md` to disk.
> 3. **NO CODE IMPLEMENTATION**: You MUST NOT modify source code files (Java, TypeScript, Go, etc.), run build scripts, or implement features. Implementing code during `/create_plan` is STRICTLY FORBIDDEN. Code implementation is reserved ONLY for `/implement_plan`.



## PART I - IF A TICKET IS MENTIONED

0c. use `linear` cli to fetch the selected item into thoughts with the ticket number - ./thoughts/shared/tickets/ENG-xxxx.md
0d. read the ticket and all comments to learn about past implementations and research, and any questions or concerns about them


### PART I - IF NO TICKET IS MENTIONED

0.  read .claude/commands/linear.md
0a. fetch the top 10 priority items from linear in status "ready for spec" using the MCP tools, noting all items in the `links` section
0b. select the highest priority SMALL or XS issue from the list (if no SMALL or XS issues exist, EXIT IMMEDIATELY and inform the user)
0c. use `linear` cli to fetch the selected item into thoughts with the ticket number - ./thoughts/shared/tickets/ENG-xxxx.md
0d. read the ticket and all comments to learn about past implementations and research, and any questions or concerns about them

### PART II - NEXT STEPS

think deeply

1. move the item to "plan in progress" using the MCP tools
1a. read ./claude/commands/create_plan.md
1b. determine if the item has a linked implementation plan document based on the `links` section
1d. if the plan exists, you're done, respond with a link to the ticket
1e. if the research is insufficient or has unaswered questions, create a new plan document following the instructions in ./claude/commands/create_plan.md

think deeply

2. when the plan is complete, `humanlayer thoughts sync` and attach the doc to the ticket using the MCP tools and create a terse comment with a link to it (re-read .claude/commands/linear.md if needed)
2a. move the item to "plan in review" using the MCP tools

think deeply, use TodoWrite to track your tasks. When fetching from linear, get the top 10 items by priority but only work on ONE item - specifically the highest priority SMALL or XS sized issue.

### PART III - When you're done


Print a message for the user (replace placeholders with actual values):

```
✅ Completed implementation plan for TICKET-XXXX: [ticket title]

Approach: [selected approach description]

The plan has been:

Created at thoughts/shared/plans/YYYY-MM-DD-TICKET-XXXX-description.md
Synced to thoughts repository
Attached to the Linear ticket
Ticket moved to "plan in review" status

Implementation phases:
- Phase 1: [phase 1 description]
- Phase 2: [phase 2 description]
- Phase 3: [phase 3 description if applicable]

View the ticket: https://linear.app/humanlayer/issue/TICKET-XXXX/[ticket-slug]
```


## File Discovery Guidelines
- **CRITICAL**: NEVER execute file search tools (such as `find_by_name` or `list_dir`) with `Pattern: "*"` directly on a root directory containing build/dependency folders (`node_modules/`, `target/`, `dist/`, `.git/`).
- Always specify target source subdirectories (e.g. `backend/src`, `frontend/src`, `thoughts/`) or filter by specific file extensions (`*.java`, `*.ts`, `*.md`, `*.json`).
