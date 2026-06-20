# Interview Questions

Deliver via **AskQuestion** — one call per round. See [interaction-questionnaire.md](interaction-questionnaire.md). **Never** ask interview topics as free-text chat lists. Translate prompts to the user's `LANGUAGE`. Document answers in `docs/workflow/bootstrap/context.md`.

## Round 1 — Tools and process

| id | Topic | Type |
|----|-------|------|
| `tools` | AI tools (`cursor`, `claude`, `codex`) | multi-select |
| `branch_strategy` | Branch strategy | select (+ other) |
| `production_risk` | Production active / merge risk | select |
| `merge_approver` | Who approves production merge | select (+ other) |
| — | One sentence: what does this project do? | free-text (chat after round) |

## Round 2 — Integrations (flags)

| id | Flag | Options |
|----|------|---------|
| `jira_tasks` | JIRA_TASKS | ON / OFF |
| `github_pull_requests` | GITHUB_PULL_REQUESTS | ON / OFF |
| `confluence` | CONFLUENCE | ON / OFF |

If ON: one follow-up for project key, space key, or MCP status. If MCP not ready: record `MCP_PENDING` in `workflow.config.md`.

## Round 3 — Quality and risk

| id | Topic | Type |
|----|-------|------|
| `test_confidence` | Test confidence | select: none / low / medium / high |
| `ci_blocks_merge` | CI blocks merge | select: yes / no / partial |
| `guard_rails` | Auth / payments / PII guard-rails | select: yes / no / unsure |
| — | Critical flows that must never regress (2–5) | free-text |
| — | Database: schema location, local dev | free-text if scan unclear |
| — | CI jobs today (if not in scan) | free-text if needed |

## Round 4 — Optional (if complex)

Ask only when scan or prior answers indicate need:

| Topic | Type |
|-------|------|
| Monorepo pilot package | select or free-text |
| Issue tracker workflow states | free-text |
| Deploy manual vs automatic | select |
| Harness adoption timeline | free-text |

## Inference rules (do not ask if scan is clear)

| Scan found | Skip question |
|------------|---------------|
| `.github/workflows/ci.yml` with test job | "Does CI exist?" — ask only if blocking |
| `jest` in package.json | Unit runner — confirm pattern only |
| `AGENTS.md` | Ask if team wants to replace or extend |

## After interview

Produce:

- Completed `workflow.config.md` values
- `context.md` with decisions (include `LANGUAGE`)
- Input for gap analysis (maturity-model.md)
