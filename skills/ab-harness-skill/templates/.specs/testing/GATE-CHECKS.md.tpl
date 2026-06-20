# Gate checks — {{PROJECT_NAME}}

> Canonical merge gates. Legacy mirror: [docs/workflow/gates.md](../../docs/workflow/gates.md).

## Gate 1 — Feature → {{INTEGRATION_BRANCH}}

| Check | Runner / source | Blocking |
|-------|-----------------|----------|
| Lint + build green | `lint-build` | Yes |
| Unit tests (touched area) | `unit` | Yes |
| Integration tests | `integration` | Yes if configured |
| E2E / API tests | `e2e` | Yes if configured |
| UAT critical flows | `uat` | Yes if UI + configured |
| CI green on PR | GitHub / CI | Yes |
| Validation lane report **APROVADO** | [reports/](reports/) | Yes |
| Docs updated if contracts changed | implementer | Yes |

**Evidence:** `.specs/testing/reports/<date>-<slug>.md` consolidated by `validation-lane:merge`.

## Gate 2 — {{INTEGRATION_BRANCH}} → {{PRODUCTION_BRANCH}}

Gate 1 plus:

| Check | Notes |
|-------|-------|
| E2E critical suite | Full suite, not pattern-scoped |
| UAT critical flows | Required when UI; see [runners/uat.md](runners/uat.md) |
| Deploy checklist | [project/DEPLOY-PLAN.md](../project/DEPLOY-PLAN.md) |
| Human approval | Release owner sign-off |

## Gate 3 — Hotfix → {{PRODUCTION_BRANCH}}

| Check | Notes |
|-------|-------|
| Minimal fix + targeted test | Pattern-scoped lane OK |
| Smoke after deploy | Document in delivery |
| Sync back to {{INTEGRATION_BRANCH}} | Required |

## Runner status semantics

| Status | Gate 1 effect |
|--------|---------------|
| PASS | Satisfies check |
| SKIP | Non-blocking (runner not configured or N/A) |
| FAIL | **REPROVADO** — fix and re-run full lane |
| MISSING | **REPROVADO** — runner did not execute |

See [GATE-CHECKS mapping in TEST-LANE-CLI.md](TEST-LANE-CLI.md) for CLI commands per gate.
