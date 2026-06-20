# Test Lane — Isolated Validation

## Principle

**Who implements does not formally validate.** The implementer may run a fast loop during development; the formal lane is executed by isolated runners with minimal context.

## Flow (fixed order)

```
1. Handoff     → scope artifact (JSON)
2. Runners (N) → parallel when possible, readonly on code
3. Merge       → consolidated report from runner JSON evidence
4. Gate        → attach report to PR / tracker
```

## Runners (roles)

| Role | Objective |
|------|-----------|
| `lint-build` | Lint + build green |
| `unit` | Unit tests for touched area |
| `integration` | Module/integration tests |
| `e2e` | API or end-to-end tests |
| `uat` | UI critical flows (skip if N/A) |

Commands come from `docs/workflow/lane-commands.json` — discovered at bootstrap, not hardcoded.

## Handoff contract

```json
{
  "name": "slug",
  "tracker": "PROJ-42",
  "pattern": "module-name",
  "area": "src/module",
  "changedFiles": [],
  "uatMode": "smart"
}
```

`tracker` omitted when `JIRA_TASKS=OFF`.

## Runner output contract

Each runner writes: `.specs/testing/reports/.tmp-<slug>-<role>.json` (paths from `workflow.config.md` → `REPORTS_DIR`).

```json
{
  "role": "unit",
  "slug": "my-feature",
  "status": "PASS",
  "exitCode": 0,
  "summary": "42 tests passed",
  "timestamp": "2026-06-18T12:00:00Z"
}
```

## Merge report

`.specs/testing/reports/<date>-<slug>.md` must state:

> Consolidated by validation-lane merge from N runner evidence files.

## Anti-patterns

| Do not | Why |
|--------|-----|
| Hand-write final report | No auditable JSON evidence |
| Implementer runs all runners as gate | Self-validation bias |
| Skip merge | No single source of truth |
| Use fallback lane without approval | Weak gate |

## Isolation modes (per tool)

| Tool | Mode | How |
|------|------|-----|
| Cursor | `subagents` | Separate Task sessions, readonly |
| Claude | `multi-session` | New session per runner role |
| Codex | `script-only` | `validation-lane:runner` sequential |

Script-only still preserves evidence JSON; isolation is weaker but process is identical.

## UAT

If `lane-commands.json` has `"uat": null`, runner records `SKIP` (informative, non-blocking on Gate 1).
