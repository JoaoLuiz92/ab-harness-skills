# Workflow Harness

Agent development methodology for **{{PROJECT_NAME}}**.

## Start here (every session)

1. Read [workflow.config.md](../../workflow.config.md) at repo root
2. Read [next_actions.md](next_actions.md) for current queue
3. Follow [test-lane.md](test-lane.md) when closing deliveries

## Methodology (summary)

| Phase | Doc |
|-------|-----|
| Spec-driven development | Bootstrap skill `references/methodology/sdd.md` |
| Validation lane | [test-lane.md](test-lane.md) |
| Merge gates | [gates.md](gates.md) |
| Feedback loops | Fast loop during dev; formal lane before merge |

## Directory layout

```
docs/workflow/
├── README.md           (this file)
├── next_actions.md     (task queue if JIRA_TASKS=OFF)
├── merge-checklist.md
├── test-lane.md
├── pilot-guide.md
├── mcp-setup.md
├── lane-commands.json
├── handoff/
├── reports/
├── bootstrap/          (install artifacts)
└── features/<name>/    (spec, tasks)
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
