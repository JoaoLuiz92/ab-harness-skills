# Runner: unit

**Role:** `unit`  
**Objective:** Unit tests for the touched area (pattern from handoff).

## Command source

`docs/workflow/lane-commands.json` → `unit` map. Substitute `{{pattern}}` from handoff.

## Default

**ON** — blocking on Gate 1.

## Execute

```bash
npm run validation-lane:runner -- --runner unit --name <slug> --pattern <p>
```

## Skip conditions

- Empty `unit` map → SKIP (non-blocking; configure in lane-commands.json)

## Context

Read [CONTEXT-BOUNDARIES.md](../CONTEXT-BOUNDARIES.md). Read handoff `area` and `changedFiles` only.
