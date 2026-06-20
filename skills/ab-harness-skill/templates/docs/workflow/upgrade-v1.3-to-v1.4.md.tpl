# Upgrade harness v1.3 → v1.4

> For repos bootstrapped with AB Harness Skill **≤ 1.3.x**. Regenerate or patch manually.

## What changed

| v1.3 | v1.4 |
|------|------|
| `.specs/testing/strategy.md` | `.specs/testing/STRATEGY.md` + full lane docs |
| `docs/workflow/handoff/` | `.specs/testing/handoff/` |
| `docs/workflow/reports/` | `.specs/testing/reports/` |
| Hardcoded paths in `validation-lane.mjs` | Reads `workflow.config.md` |

## Quick upgrade (recommended)

Re-run specs generation with your install config:

```bash
node scripts/generate-specs.mjs --target . --config docs/workflow/bootstrap/install-config.json
```

Or copy install config from bootstrap interview output.

Then sync scripts and config from a fresh install diff, or apply patches below.

## Manual patches

### 1. `workflow.config.md`

```ini
LANE_COMMANDS=docs/workflow/lane-commands.json
HANDOFF_DIR=.specs/testing/handoff
REPORTS_DIR=.specs/testing/reports
```

Remove old `docs/workflow/handoff` and `docs/workflow/reports` keys if present.

### 2. `scripts/validation-lane.mjs`

Replace with the version from ab-harness-skill **1.4.0+** templates (reads `workflow.config.md`).

### 3. `.specs/testing/`

Ensure these exist (from skill templates):

- `STRATEGY.md`, `GATE-CHECKS.md`, `SUBAGENTS.md`, `SUBAGENTS-FLOW.md`
- `TEST-LANE-CLI.md`, `CONTEXT-BOUNDARIES.md`, `MODEL-ROUTING.md` (v1.4.1+)
- `runners/*.md`, `reports/TEMPLATE.md`, empty `handoff/`

### 4. Cursor rules

Install or update:

- `.cursor/rules/validation-lane.mdc` — paths under `.specs/testing/`
- `.cursor/rules/model-routing.mdc` — v1.4.1+

### 5. Migrate artifacts (optional)

If you have open deliveries:

```bash
mkdir -p .specs/testing/handoff .specs/testing/reports
mv docs/workflow/handoff/* .specs/testing/handoff/ 2>/dev/null || true
mv docs/workflow/reports/* .specs/testing/reports/ 2>/dev/null || true
```

### 6. Verify

```bash
npm run validation-lane:handoff -- --name upgrade-smoke --pattern test
npm run validation-lane:merge -- --name upgrade-smoke
```

Report should land in `.specs/testing/reports/`.

## v1.4.1 guard-rails (optional)

- `AGENTS.md` — "Source of truth" section
- Expanded `HARD_RULES` with S0/S1 lane policy
- `CHANGELOG.md` in skill package for release notes
