# Test lane CLI — {{PROJECT_NAME}}

> Command reference. Paths from [workflow.config.md](../../workflow.config.md).

## Paths

| Artifact | Location |
|----------|----------|
| Handoff JSON | `.specs/testing/handoff/<slug>.json` |
| Runner evidence | `.specs/testing/reports/.tmp-<slug>-<role>.json` |
| Merged report | `.specs/testing/reports/<date>-<slug>.md` |
| Commands config | `docs/workflow/lane-commands.json` |

## npm scripts

```bash
# 1. Handoff
npm run validation-lane:handoff -- --name <slug> {{TRACKER_FLAG}} --pattern <p> --area <path>

# 2. Runner (one role per isolated agent)
npm run validation-lane:runner -- --runner lint-build --name <slug> --pattern <p>
npm run validation-lane:runner -- --runner unit --name <slug> --pattern <p>
npm run validation-lane:runner -- --runner integration --name <slug> --pattern <p>
npm run validation-lane:runner -- --runner e2e --name <slug> --pattern <p>
npm run validation-lane:runner -- --runner uat --name <slug> --pattern <p>

# 3. Merge
npm run validation-lane:merge -- --name <slug> {{TRACKER_FLAG}}
```

## Direct node (no npm)

```bash
node scripts/validation-lane.mjs --write-handoff --name <slug>
node scripts/validation-lane.mjs --runner unit --name <slug> --pattern <p>
node scripts/validation-lane.mjs --merge --name <slug>
```

## Fast loop (during dev — not formal gate)

```bash
{{TEST_CMD}} -- {{PATTERN_EXAMPLE}}
```

## Gate mapping

| Gate | Runners required |
|------|------------------|
| Gate 1 | All 5 (SKIP OK for unconfigured e2e/uat) |
| Gate 2 | Full e2e + uat when UI |
| Gate 3 | lint-build + unit (pattern-scoped) |

See [GATE-CHECKS.md](GATE-CHECKS.md).
