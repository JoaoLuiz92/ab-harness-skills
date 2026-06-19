# Specs — {{PROJECT_NAME}}

Agent-readable project knowledge. Generated at bootstrap; update as the codebase evolves.

## Layout

```
.specs/
├── README.md           (this file)
├── codebase/           (mapped from repo scan)
│   ├── overview.md
│   ├── structure.md
│   └── stack.md
├── project/            (goals, branches, integrations)
│   └── context.md
├── features/           (SDD: spec, design, tasks per delivery)
│   └── <slug>/
├── quick/              (small-scope specs)
│   └── _template.md
└── testing/            (test strategy + lane hints)
    └── strategy.md
```

## Session start (with workflow harness)

1. [workflow.config.md](../workflow.config.md)
2. [codebase/overview.md](codebase/overview.md) — skim for orientation
3. [project/context.md](project/context.md)
4. [docs/workflow/next_actions.md](../docs/workflow/next_actions.md) when `JIRA_TASKS=OFF`

## SDD sizing

| Scope | Where to write |
|-------|----------------|
| Small fix | `.specs/quick/<slug>.md` or inline in `next_actions.md` |
| Medium+ | `.specs/features/<slug>/spec.md` (+ optional `design.md`, `tasks.md`) |

Methodology: `docs/workflow/` + harness skill `references/methodology/sdd.md`.

## Refresh codebase map

```bash
node scripts/generate-specs.mjs --target .
```

Optional: pass install config JSON with `--config <path>` to refresh `.specs/project/context.md` placeholders.
