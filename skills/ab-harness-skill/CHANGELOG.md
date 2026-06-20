# Changelog

All notable changes to **ab-harness-skill** (skills.sh package).

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.1] — 2026-06-20

### Added

- `.specs/testing/MODEL-ROUTING.md` — S0–S3 tier policy for coordinator vs runners
- `.cursor/rules/model-routing.mdc` — always-on Cursor rule
- `AGENTS.md` — **Source of truth** table (`.specs/` vs legacy `docs/workflow/`)
- Expanded default `HARD_RULES` guard-rails (S0/S1 lane, spec drift)
- `docs/workflow/upgrade-v1.3-to-v1.4.md` — brownfield upgrade guide
- GitHub Actions CI for `npm run test:skill-package`

### Changed

- `validation-lane.mdc` — explicit coordinator S1 / runner S0 model routing
- `workflow-core.mdc` — points to `.specs/testing/` canonical paths
- Synced root `package.json` version with skill metadata

## [1.4.0] — 2026-06-20

### Added

- Test lane source of truth under `.specs/testing/`:
  - `GATE-CHECKS`, `SUBAGENTS`, `SUBAGENTS-FLOW`, `TEST-LANE-CLI`, `CONTEXT-BOUNDARIES`
  - `STRATEGY.md` (replaces inline `strategy.md`)
  - `runners/` (lint-build, unit, integration, e2e, uat — SKIP default for e2e/uat)
  - `handoff/`, `reports/TEMPLATE.md`
- `validation-lane.mjs` reads `HANDOFF_DIR`, `REPORTS_DIR`, `LANE_COMMANDS` from `workflow.config.md`
- Smoke E2E test: handoff → 5 runners → merge → report

### Changed

- `workflow.config.md` — handoff/reports paths moved to `.specs/testing/`
- Legacy pointers in `docs/workflow/test-lane.md`, `gates.md`, adapters

## [1.3.0] — 2026-06-20

### Added

- `.specs/project/` — PROJECT, STATE, ROADMAP, DEPLOY-PLAN, context
- `.specs/quick/` — CURRENT-FOCUS, NEXT-ACTIONS (GIA session order)
- `.specs/features/delivery.md.tpl` — 8-section delivery close template
- `generate-specs.mjs` extended for project + quick templates
- Install smoke asserts for v1.3 layout

### Changed

- `AGENTS.md` — session starts with CURRENT-FOCUS before DISCOVERY
- `.specs/README.md` — 4+2 layout documentation

## [1.2.0] — 2026-06-18

### Added

- 8-doc codebase map under `.specs/codebase/` (DISCOVERY, STACK, ARCHITECTURE, etc.)
- Adaptive discovery gate (≥80% applicable checklist or harness-only N/A)
- `npm run specs:refresh` — merge-safe codebase map refresh
- Deep scan extractors (node-nest, node-react, generic)
- Brownfield + harness-only fixture smoke tests

## [1.1.0] — 2026-06-15

### Added

- Validation lane script (`validation-lane.mjs`) with handoff / runner / merge
- Cursor + Claude + Codex adapter templates
- `workflow.config.md`, `lane-commands.json`, merge gates docs

## [1.0.0] — 2026-06-12

### Added

- Initial skills.sh package: bootstrap flow (scan → interview → plan → install)
- SDD methodology references (TLC-informed)
- `install-harness.mjs`, `scan-profile.mjs`, `map-codebase.mjs`

[1.4.1]: https://github.com/JoaoLuiz92/ab-harness-skills/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/JoaoLuiz92/ab-harness-skills/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/JoaoLuiz92/ab-harness-skills/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/JoaoLuiz92/ab-harness-skills/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JoaoLuiz92/ab-harness-skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/JoaoLuiz92/ab-harness-skills/releases/tag/v1.0.0
