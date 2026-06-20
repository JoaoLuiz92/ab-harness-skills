# Validation subagents — {{PROJECT_NAME}}

> Role definitions for isolated lane runners. Flow: [SUBAGENTS-FLOW.md](SUBAGENTS-FLOW.md).

## Principle

**Implementer does not formally validate.** Each runner is a separate agent/session with minimal context.

## Roles

| Role | Objective | Default | Doc |
|------|-----------|---------|-----|
| `lint-build` | Lint + compile/build | ON | [runners/lint-build.md](runners/lint-build.md) |
| `unit` | Unit tests for touched area | ON | [runners/unit.md](runners/unit.md) |
| `integration` | Module/integration tests | ON | [runners/integration.md](runners/integration.md) |
| `e2e` | API or end-to-end tests | SKIP if null | [runners/e2e.md](runners/e2e.md) |
| `uat` | UI critical flows | SKIP if null | [runners/uat.md](runners/uat.md) |

Commands: [docs/workflow/lane-commands.json](../../docs/workflow/lane-commands.json).

## Isolation modes (from workflow.config.md)

| Tool | Mode | How |
|------|------|-----|
| Cursor | {{VALIDATION_CURSOR}} | Task subagents, `readonly: true` |
| Claude | {{VALIDATION_CLAUDE}} | New session per role |
| Codex | {{VALIDATION_CODEX}} | Sequential `validation-lane:runner` |

## Context allowed per runner

Read [CONTEXT-BOUNDARIES.md](CONTEXT-BOUNDARIES.md) before dispatch. Runners must **not** read full feature specs or implementation notes.

## Output contract

Each runner writes: `.specs/testing/reports/.tmp-<slug>-<role>.json`

```json
{
  "role": "unit",
  "slug": "my-feature",
  "status": "PASS",
  "exitCode": 0,
  "summary": "42 tests passed",
  "timestamp": "2026-06-20T12:00:00Z"
}
```

Merge produces: `.specs/testing/reports/<date>-<slug>.md` — see [reports/TEMPLATE.md](reports/TEMPLATE.md).
