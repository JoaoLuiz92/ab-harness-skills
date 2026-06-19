# Cursor Adapter

## Entry points

| File | Role |
|------|------|
| `AGENTS.md` | Shared with Codex; short guard-rails |
| `.cursor/rules/*.mdc` | Always-on or glob-scoped rules |

## Rules to install (from templates)

| Rule | When |
|------|------|
| `workflow-core.mdc` | Always |
| `validation-lane.mdc` | Always |
| `close-delivery-jira.mdc` | `JIRA_TASKS=ON` |
| `close-delivery-local.mdc` | `JIRA_TASKS=OFF` |
| `create-pr.mdc` | `GITHUB_PULL_REQUESTS=ON` |
| `document-wiki.mdc` | `CONFLUENCE=ON` |

## MCP

- Project: `.cursor/mcp.json` (optional; often user-level)
- Document in `docs/workflow/mcp-setup.md` — do not commit tokens

## Validation lane — `VALIDATION_CURSOR=subagents`

1. Coordinator implements (does not run merge as self-validation gate)
2. Dispatch **5 parallel** `Task` subagents (`subagent_type: shell`, `readonly: true`)
3. Each runs: `npm run validation-lane:runner -- --runner <role> --name <slug>`
4. Coordinator runs merge after all JSON exist

Roles: `lint-build`, `unit`, `integration`, `e2e`, `uat`

**Prohibited:** Coordinator running all 5 runners in own shell without Task isolation.

## Fallback

`VALIDATION_CURSOR=script-only` — same as Codex sequential runners.

## Skills

Optional: copy `harness-bootstrap` skill reference in `docs/workflow/README.md` for re-bootstrap.
