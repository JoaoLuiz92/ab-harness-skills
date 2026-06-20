# Subagent flow — validation lane

> Coordinator playbook. CLI reference: [TEST-LANE-CLI.md](TEST-LANE-CLI.md).

## Sequence

```mermaid
sequenceDiagram
  participant C as Coordinator
  participant H as handoff JSON
  participant R1 as lint-build
  participant R2 as unit
  participant R3 as integration
  participant R4 as e2e
  participant R5 as uat
  participant M as merge report

  C->>H: validation-lane:handoff
  par Parallel runners
    C->>R1: runner lint-build
    C->>R2: runner unit
    C->>R3: runner integration
    C->>R4: runner e2e
    C->>R5: runner uat
  end
  R1-->>M: .tmp-<slug>-*.json
  R2-->>M: .tmp-<slug>-*.json
  R3-->>M: .tmp-<slug>-*.json
  R4-->>M: .tmp-<slug>-*.json
  R5-->>M: .tmp-<slug>-*.json
  C->>M: validation-lane:merge
```

## Step 1 — Handoff (coordinator)

```bash
npm run validation-lane:handoff -- \
  --name <slug> \
  {{TRACKER_FLAG}} \
  --pattern <test-pattern> \
  --area <source-path>
```

Creates: `.specs/testing/handoff/<slug>.json`

## Step 2 — Dispatch runners (isolated)

**Cursor (`VALIDATION_CURSOR=subagents`):** dispatch **5 parallel** Task subagents (`subagent_type: shell`, `readonly: true`). Each runs only:

```bash
npm run validation-lane:runner -- --runner <role> --name <slug> --pattern <p>
```

Roles: `lint-build`, `unit`, `integration`, `e2e`, `uat`

**Claude:** new session per role with same command.

**Codex:** run all 5 sequentially.

**Prohibited:** coordinator running all 5 runners in own shell without isolation.

## Step 3 — Merge (coordinator)

```bash
npm run validation-lane:merge -- --name <slug> {{TRACKER_FLAG}}
```

Produces: `.specs/testing/reports/<date>-<slug>.md`

## Step 4 — Gate

Attach report to PR / tracker. Verify [GATE-CHECKS.md](GATE-CHECKS.md) Gate 1 criteria.

## On failure

1. Fix code
2. New handoff (same or new slug)
3. Re-run **all** runners
4. Merge again

No partial re-run for formal gate unless documented as hotfix scope.
