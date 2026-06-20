# AGENTS.md — {{PROJECT_NAME}}

Guidance for AI coding agents. **Read [workflow.config.md](workflow.config.md) every session.**

## Session start

1. [.specs/quick/CURRENT-FOCUS.md](.specs/quick/CURRENT-FOCUS.md) — active initiative and constraints
2. [.specs/codebase/DISCOVERY.md](.specs/codebase/DISCOVERY.md) — brownfield index
3. [.specs/project/PROJECT.md](.specs/project/PROJECT.md) + [STATE.md](.specs/project/STATE.md) when needed
4. Task queue: [.specs/quick/NEXT-ACTIONS.md](.specs/quick/NEXT-ACTIONS.md) (canonical) · legacy: {{TASKS_SOURCE}}

## Source of truth

| Domain | Canonical path | Legacy mirror |
|--------|----------------|---------------|
| Session / queue | `.specs/quick/` | `docs/workflow/next_actions.md` |
| Project memory | `.specs/project/` | `docs/workflow/bootstrap/context.md` |
| Codebase map | `.specs/codebase/` | `docs/workflow/bootstrap/codebase/` |
| Features / SDD | `.specs/features/` | — |
| Test lane | `.specs/testing/` | `docs/workflow/test-lane.md`, `gates.md` |
| Lane commands | `docs/workflow/lane-commands.json` | — |
| Tool config | `workflow.config.md` | — |

**Rule:** prefer `.specs/` over `docs/workflow/` when both exist.

## Workflow

- Specs map: [.specs/README.md](.specs/README.md)
- Methodology: [docs/workflow/README.md](docs/workflow/README.md)
- Validation lane: [.specs/testing/SUBAGENTS-FLOW.md](.specs/testing/SUBAGENTS-FLOW.md) · legacy: [docs/workflow/test-lane.md](docs/workflow/test-lane.md)
- Merge gates: [.specs/testing/GATE-CHECKS.md](.specs/testing/GATE-CHECKS.md) · legacy: [docs/workflow/gates.md](docs/workflow/gates.md)
- Model routing: [.specs/testing/MODEL-ROUTING.md](.specs/testing/MODEL-ROUTING.md)

## Hard rules

{{HARD_RULES}}

## Commands

```bash
# Install / dev — adjust per project
{{INSTALL_CMD}}
{{TEST_CMD}}
{{BUILD_CMD}}
```

## Validation lane (closing deliveries)

1. `npm run validation-lane:handoff -- --name <slug> ...`
2. Run 5 isolated runners (see workflow.config.md VALIDATION_* modes)
3. `npm run validation-lane:merge -- --name <slug>`
4. For **medium+** features: write `.specs/features/<slug>/delivery.md` from [delivery.md.tpl](.specs/features/delivery.md.tpl)
5. Attach report to PR / tracker per integration flags

**Implementer does not self-validate as formal gate.**

## Documentation

- Repo docs: `{{DOCS_FALLBACK}}`
{{CONFLUENCE_NOTE}}

## Tools

Active: {{TOOLS}}

Installed by AB Harness Skill.
