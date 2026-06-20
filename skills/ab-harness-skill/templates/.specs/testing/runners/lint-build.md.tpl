# Runner: lint-build

**Role:** `lint-build`  
**Objective:** Lint and build/compile green before tests.

## Command source

`docs/workflow/lane-commands.json` → `lintBuild` map.

## Default

**ON** — blocking on Gate 1 unless SKIP (empty config).

## Execute

```bash
npm run validation-lane:runner -- --runner lint-build --name <slug>
```

## Skip conditions

- No `lintBuild` entries in lane-commands → records SKIP (non-blocking)

## Context

Read [CONTEXT-BOUNDARIES.md](../CONTEXT-BOUNDARIES.md). Do not modify source files.
