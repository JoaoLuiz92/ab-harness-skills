# Runner: e2e

**Role:** `e2e`  
**Objective:** API or end-to-end tests (Playwright, Cypress, supertest, etc.).

## Command source

`docs/workflow/lane-commands.json` → `e2e` map.

## Default

**SKIP** — `"e2e": null` at bootstrap. Enable when project has E2E suite.

## Execute

```bash
npm run validation-lane:runner -- --runner e2e --name <slug> --pattern <p>
```

## Skip conditions

- `e2e` is `null` or empty → SKIP (informative, non-blocking on Gate 1)
- Gate 2 may require full E2E — see [GATE-CHECKS.md](../GATE-CHECKS.md)

## Context

Read [CONTEXT-BOUNDARIES.md](../CONTEXT-BOUNDARIES.md).
