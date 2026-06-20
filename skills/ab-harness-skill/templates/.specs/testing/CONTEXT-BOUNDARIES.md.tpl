# Context boundaries — validation runners

> What isolated runners may and may not read. Coordinator provides scope via handoff JSON only.

## Runners MAY read

| Resource | Why |
|----------|-----|
| `workflow.config.md` | Paths and tool flags |
| `docs/workflow/lane-commands.json` | Commands to execute |
| `.specs/testing/handoff/<slug>.json` | Scope: pattern, area, changedFiles |
| `.specs/testing/runners/<role>.md` | Role-specific instructions |
| `.specs/codebase/TESTING.md` | Test conventions (inventory only) |
| Source under `area` from handoff | Run tests against changed code |

## Runners MUST NOT read

| Resource | Why |
|----------|-----|
| `.specs/features/*/spec.md`, `design.md` | Avoid validating own assumptions |
| `.specs/quick/*` except handoff metadata | Session context bias |
| Implementation chat / coordinator notes | Self-validation bias |
| Full `.specs/codebase/ARCHITECTURE.md` | Unnecessary scope creep |

## Coordinator MAY read (before handoff)

Everything needed to implement — including full specs. After handoff, coordinator **does not** run runners as self-validation; dispatches isolated agents per [SUBAGENTS-FLOW.md](SUBAGENTS-FLOW.md).

## Handoff minimum fields

```json
{
  "name": "slug",
  "pattern": "module-name",
  "area": "src/module",
  "changedFiles": ["src/module/foo.ts"],
  "createdAt": "ISO-8601"
}
```

Optional: `tracker` when `JIRA_TASKS=ON`; `uatMode` for future UAT smart scope (v1.6).

## Evidence-only output

Runners write JSON evidence only. No markdown reports, no code edits, no commits.
