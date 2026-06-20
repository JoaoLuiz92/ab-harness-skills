# Testing strategy — {{PROJECT_NAME}}

> Generated at bootstrap. Formal lane: [SUBAGENTS-FLOW.md](SUBAGENTS-FLOW.md) · CLI: [TEST-LANE-CLI.md](TEST-LANE-CLI.md).

## Frameworks detected

{{TEST_FRAMEWORKS_LIST}}

## Fast loop (during development)

{{FAST_LOOP_LINE}}

Allowed during implementation. **Does not** satisfy merge gate.

## Validation lane (before merge)

| Item | Path |
|------|------|
| Strategy + gates | [GATE-CHECKS.md](GATE-CHECKS.md) |
| Subagent roles | [SUBAGENTS.md](SUBAGENTS.md) |
| Coordinator flow | [SUBAGENTS-FLOW.md](SUBAGENTS-FLOW.md) |
| Commands config | [docs/workflow/lane-commands.json](../../docs/workflow/lane-commands.json) |
| Handoff | `.specs/testing/handoff/<slug>.json` |
| Report | `.specs/testing/reports/<date>-<slug>.md` |

```bash
npm run validation-lane:handoff -- --name <slug> ...
npm run validation-lane:merge -- --name <slug>
```

## Codebase test map

- [codebase/TESTING.md](../codebase/TESTING.md) — inventory and CI
- [codebase/DISCOVERY.md](../codebase/DISCOVERY.md) — discovery index

{{LANE_COMMANDS_SECTION}}

## Traceability

Each acceptance criterion in `.specs/features/` or `.specs/quick/` should map to at least one test or gate check before merge.

Legacy mirror: [docs/workflow/test-lane.md](../../docs/workflow/test-lane.md).
