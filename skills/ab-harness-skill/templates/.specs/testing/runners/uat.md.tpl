# Runner: uat

**Role:** `uat`  
**Objective:** UI critical flows (manual checklist or automated UAT).

## Command source

`docs/workflow/lane-commands.json` → `uat` map.

## Default

**SKIP** — `"uat": null` at bootstrap. Enable for UI projects (v1.6 adds Playwright smart scope).

## Execute

```bash
npm run validation-lane:runner -- --runner uat --name <slug> --pattern <p>
```

## Skip conditions

- `uat` is `null` → SKIP (non-blocking on Gate 1)
- Non-UI backend-only projects: keep null

## Context

Read [CONTEXT-BOUNDARIES.md](../CONTEXT-BOUNDARIES.md).

## Future (v1.6)

`handoff.uatMode`: `full` | `smart` | `skip` with `.uat-scope.json` impact map.
