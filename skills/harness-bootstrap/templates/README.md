# Template install map

Agent or `scripts/install-harness.mjs` copies these to the **target repo**.

## Always

| Template | Target |
|----------|--------|
| `workflow.config.md.tpl` | `workflow.config.md` |
| `AGENTS.md.tpl` | `AGENTS.md` |
| `docs/workflow/*.tpl` | `docs/workflow/*` (strip `.tpl`) |
| `scripts/validation-lane.mjs.tpl` | `scripts/validation-lane.mjs` |
| `package.json.scripts.fragment` | merge into `package.json` `scripts` |

## If `claude` in TOOLS

| Template | Target |
|----------|--------|
| `CLAUDE.md.tpl` | `CLAUDE.md` |
| `adapters/claude/rules/*` | `.claude/rules/` |

## If `cursor` in TOOLS

| `adapters/cursor/rules/*` | `.cursor/rules/` |

Conditional rules (install subset):

| Flag ON | Rules |
|---------|-------|
| JIRA_TASKS | `close-delivery-jira.*` |
| JIRA OFF | `close-delivery-local.*` |
| GITHUB_PULL_REQUESTS | `create-pr.*` |
| CONFLUENCE | `document-wiki.*` |

Always: `workflow-core`, `validation-lane`

## If `codex` in TOOLS

| `adapters/codex/config.toml.example` | `.codex/config.toml.example` |

## Placeholders

Replace `{{KEY}}` from install config JSON. See `scripts/install-config.example.json`.
