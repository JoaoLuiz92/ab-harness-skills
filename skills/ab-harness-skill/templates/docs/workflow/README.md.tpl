# Workflow Harness

Agent development methodology for **{{PROJECT_NAME}}**.

## Start here (every session)

1. Read [workflow.config.md](../../workflow.config.md) at repo root
2. Skim [.specs/codebase/DISCOVERY.md](../../.specs/codebase/DISCOVERY.md) and [.specs/project/context.md](../../.specs/project/context.md)
3. Read [next_actions.md](next_actions.md) for current queue
4. Follow [.specs/testing/SUBAGENTS-FLOW.md](../../.specs/testing/SUBAGENTS-FLOW.md) when closing deliveries (legacy: [test-lane.md](test-lane.md))

## Methodology (summary)

| Phase | Doc |
|-------|-----|
| Spec-driven development | Bootstrap skill `references/methodology/sdd.md` |
| Validation lane | [test-lane.md](test-lane.md) |
| Merge gates | [gates.md](gates.md) |
| Upgrade v1.3→v1.4 | [upgrade-v1.3-to-v1.4.md](upgrade-v1.3-to-v1.4.md) |
| Feedback loops | Fast loop during dev; formal lane before merge |

## Directory layout

```
.specs/                 (codebase map + SDD artifacts)
├── codebase/           DISCOVERY, STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS
├── project/            context from bootstrap
├── features/<name>/    spec, design, tasks
├── quick/              small-scope specs
└── testing/            STRATEGY, GATE-CHECKS, SUBAGENTS-FLOW, handoff/, reports/, runners/

docs/workflow/
├── README.md           (this file)
├── next_actions.md     (task queue if JIRA_TASKS=OFF)
├── merge-checklist.md
├── test-lane.md        (legacy pointer → .specs/testing/)
├── gates.md            (legacy pointer → .specs/testing/)
├── pilot-guide.md
├── mcp-setup.md
├── lane-commands.json
└── bootstrap/          (install artifacts)
```

## Tools configured

{{TOOLS_LIST}}

## Integrations

{{INTEGRATIONS_SUMMARY}}

## Commands

```bash
npm run validation-lane:handoff -- --name <slug> --pattern <p> --area <path>
npm run validation-lane:runner -- --runner lint-build --name <slug>
npm run validation-lane:merge -- --name <slug>
```

Installed by [AB Harness Skill](https://github.com/JoaoLuiz92/ab-harness-skills).
