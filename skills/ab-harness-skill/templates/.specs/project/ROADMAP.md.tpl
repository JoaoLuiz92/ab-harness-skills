# ROADMAP — Initiative sequence

Recommended order of SDD initiatives. Each item should have a folder under `.specs/features/<slug>/` with at least `spec.md`. Execute in order when dependencies apply.

| # | Initiative | Feature folder | Objective | Depends on |
|---|------------|----------------|-----------|------------|
| 1 | Brownfield discovery | `features/brownfield-discovery/` | Map stack, architecture, conventions, integrations, and risks before changing production code. | — |
| 2 | Harness pilot | `features/harness-pilot/` | First small delivery through full SDD + validation lane; calibrate `lane-commands.json`. | 1 |
| 3 | _Next initiative_ | `features/<slug>/` | _Define after pilot._ | 2 |

## Prioritization principles

1. **Discovery before refactor.** Do not refactor production without item 1 complete.
2. **Tests before large refactors.** Establish a safety net before structural changes.
3. **Nothing to `{{PRODUCTION_BRANCH}}` without [DEPLOY-PLAN.md](DEPLOY-PLAN.md).** Production promotion follows the deploy checklist.
4. **Incremental and reversible.** Prefer small PRs on `{{INTEGRATION_BRANCH}}`.

## Milestones (summary)

See [STATE.md](STATE.md) for checkboxes and AD-xxx decision log.

- **M1** — Foundation (items 1–2)
- **M2** — Safety net (tests + lane)
- **M3** — First formal delivery with `delivery.md`

_Update this table as the project evolves._
