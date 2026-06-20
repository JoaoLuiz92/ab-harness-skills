# Codebase Mapping Protocol (Part A — Phase 1b)

Phase **1a** runs a **deep code scan** (entry points, routes, modules, env usage, CI, tests, concerns) into all 8 docs. Phase **1b** fills what automation cannot see: team norms, prod topology, business-critical flows.

## Inputs

- `docs/workflow/bootstrap/profile.json` (includes `deep` analysis block)
- 8 files in `docs/workflow/bootstrap/codebase/` (already code-enriched)
- [discovery-checklist.md](discovery-checklist.md)

## What the scan already maps (from code)

| Doc | Auto-derived from |
|-----|-------------------|
| DISCOVERY | README, package layout, checklist |
| STACK | package.json scripts, CI YAML, Docker, frameworks |
| ARCHITECTURE | entry points, Nest modules, routes, guards, mermaid diagram, data flow |
| STRUCTURE | annotated tree (3 levels), package roles |
| CONVENTIONS | file suffixes, path aliases, auth decorators |
| TESTING | test files, configs, helpers/mocks, CI test jobs |
| INTEGRATIONS | deps manifest, import sites, env keys + `process.env` usage |
| CONCERNS | heuristics + code-based severity table |

## Phase 1b — agent fills gaps only

Search for `<!-- AGENT:complete -->` blocks. These are **optional refinement**, not empty scaffolds.

| Doc | Agent adds when needed |
|-----|------------------------|
| DISCOVERY | Team context, corrections |
| STACK | Prod hosting, runtime pins |
| ARCHITECTURE | Named critical user journeys |
| STRUCTURE | Obscure legacy folders |
| CONVENTIONS | PR/branch/API team rules |
| TESTING | Canonical example tests to copy |
| INTEGRATIONS | Prod vs sandbox secrets |
| CONCERNS | Compliance, SLA, on-call risks |

Rules:

- **Do not invent** — `_Unknown_` + what you searched
- **Do not fix** code — record in CONCERNS only
- Do not overwrite `<!-- auto -->` blocks (use `npm run specs:refresh` to update those)

## Checklist N/A (harness-only repos)

When `isHarnessRepo` is detected, product-oriented items absent from the repo are marked `[~] (N/A — harness repo)` and excluded from the gate denominator:

| Item | N/A when |
|------|----------|
| Monorepo layout | Single-package harness |
| HTTP/React routes | No routes in source |
| Test inventory | No test files |
| CI parsed | No CI workflows |
| Env vars + usage | No `.env.example` keys |
| Integration imports | No traced imports |
| Docker | No Docker files |
| Naming conventions | No suffix patterns detected |
| Auth patterns | No auth hints |
| Data layer | No data layer detected |

## DISCOVERY.md gate

- Checklist ≥ **80%** of **applicable** items marked `[x]` (`[~]` = N/A, excluded from denominator)
- Harness-only repos: gate passes when validation-lane / harness sections are populated and applicable items are satisfied (see `CHECKLIST_GATE_STATUS` in DISCOVERY.md)
- Status table reflects mapped docs

## Part B handoff

On `approve_install`, Part B **copies** `bootstrap/codebase/` → `.specs/codebase/`.

## Refresh after install

```bash
npm run specs:refresh
```

Updates `<!-- auto -->` sections from fresh code; preserves agent paragraphs.
