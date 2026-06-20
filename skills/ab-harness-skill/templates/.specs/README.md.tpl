# Specs — {{PROJECT_NAME}}

Agent-readable project knowledge. Generated at bootstrap; update as the codebase evolves.

## Layout

```
.specs/
├── README.md              (this file)
├── codebase/              (8-doc brownfield map)
│   ├── DISCOVERY.md       (index + checklist)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   ├── INTEGRATIONS.md
│   └── CONCERNS.md
├── project/               (memory — goals, state, roadmap, deploy)
│   ├── PROJECT.md
│   ├── STATE.md
│   ├── ROADMAP.md
│   ├── DEPLOY-PLAN.md
│   └── context.md         (bootstrap compat)
├── quick/                 (session resume)
│   ├── CURRENT-FOCUS.md
│   ├── NEXT-ACTIONS.md
│   └── _template.md
├── features/              (SDD per delivery)
│   ├── README.md
│   ├── delivery.md.tpl    (copy to <slug>/delivery.md when closing)
│   └── <slug>/
└── testing/               (validation lane — source of truth)
    ├── STRATEGY.md
    ├── GATE-CHECKS.md
    ├── SUBAGENTS.md
    ├── SUBAGENTS-FLOW.md
    ├── TEST-LANE-CLI.md
    ├── CONTEXT-BOUNDARIES.md
    ├── MODEL-ROUTING.md
    ├── handoff/           (JSON scope per delivery)
    ├── reports/           (runner evidence + merged reports)
    └── runners/           (lint-build, unit, integration, e2e, uat)
```

## Session start (GIA order)

1. [workflow.config.md](../workflow.config.md)
2. [.specs/quick/CURRENT-FOCUS.md](quick/CURRENT-FOCUS.md)
3. [codebase/DISCOVERY.md](codebase/DISCOVERY.md) — index; open the doc relevant to your task
4. [project/PROJECT.md](project/PROJECT.md) + [STATE.md](project/STATE.md) when context needed
5. Active feature under `features/<slug>/` or [quick/NEXT-ACTIONS.md](quick/NEXT-ACTIONS.md)

Legacy mirror: [docs/workflow/next_actions.md](../docs/workflow/next_actions.md) when `JIRA_TASKS=OFF`.

## SDD sizing

| Scope | Where to write | Close with |
|-------|----------------|------------|
| Small fix | `.specs/quick/<slug>.md` | Lane report + update NEXT-ACTIONS |
| Medium+ | `.specs/features/<slug>/spec.md` (+ optional `design.md`, `tasks.md`) | **`delivery.md`** + lane report |

Methodology: `docs/workflow/` + harness skill `references/methodology/sdd.md`.

## Refresh codebase map

```bash
npm run specs:refresh
```

Updates `<!-- auto -->` sections only; preserves agent-written content. Optional: pass install config JSON with `node scripts/generate-specs.mjs --config <path>` to refresh `.specs/project/*` placeholders.
