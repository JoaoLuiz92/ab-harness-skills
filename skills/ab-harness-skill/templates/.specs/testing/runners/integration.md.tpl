# Runner: integration

**Role:** `integration`  
**Objective:** Module or integration tests beyond unit scope.

## Command source

`docs/workflow/lane-commands.json` → `integration` map (falls back to `unit` if absent).

## Default

**ON** — blocking when configured.

## Execute

```bash
npm run validation-lane:runner -- --runner integration --name <slug> --pattern <p>
```

## Skip conditions

- No `integration` and empty `unit` → SKIP

## Context

Read [CONTEXT-BOUNDARIES.md](../CONTEXT-BOUNDARIES.md).
