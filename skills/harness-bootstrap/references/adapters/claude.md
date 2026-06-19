# Claude Code Adapter

## Entry points

| File | Role |
|------|------|
| `CLAUDE.md` | Primary; use `@docs/workflow/README.md` imports |
| `.claude/rules/` | Modular rules with optional path globs |
| `AGENTS.md` | Optional; Claude may read both — keep AGENTS short |

## CLAUDE.md pattern

```markdown
# Project — Claude Code

Read @workflow.config.md and @docs/workflow/README.md every session.
Hard rules: @AGENTS.md

Validation lane: @docs/workflow/test-lane.md
```

Keep under ~100 lines; link don't duplicate.

## Rules to install

Same logical set as Cursor, in `.claude/rules/`:

- `workflow-core.md`
- `validation-lane.md`
- `close-delivery-jira.md` (if JIRA ON)
- `close-delivery-local.md` (if JIRA OFF)
- `create-pr.md` (if GitHub ON)
- `document-wiki.md` (if Confluence ON)

## MCP

Claude Code shares MCP config across surfaces (CLI, Desktop). See `docs/workflow/mcp-setup.md` § Claude.

## Validation lane — `VALIDATION_CLAUDE=multi-session`

1. Implementer completes code in main session
2. For each runner role, start **new session** (or explicit role prompt):

   > You are runner `unit` only. Readonly. Run: `npm run validation-lane:runner -- --runner unit --name <slug> --pattern <p>`. Report PASS/FAIL and JSON path.

3. Merge in implementer session after 5 JSON files exist

## Fallback

`VALIDATION_CLAUDE=script-only` — run all runners sequentially in terminal.

## Skills

Claude slash commands optional; document `/close-delivery` workflow in `pilot-guide.md`.
