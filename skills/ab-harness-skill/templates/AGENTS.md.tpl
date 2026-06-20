# AGENTS.md — {{PROJECT_NAME}}

Guidance for AI coding agents. **Read [workflow.config.md](workflow.config.md) every session.**

## Workflow

- Specs map: [.specs/README.md](.specs/README.md)
- Codebase map: [.specs/codebase/DISCOVERY.md](.specs/codebase/DISCOVERY.md)
- Methodology: [docs/workflow/README.md](docs/workflow/README.md)
- Task queue: {{TASKS_SOURCE}}
- Validation lane: [docs/workflow/test-lane.md](docs/workflow/test-lane.md)
- Merge gates: [docs/workflow/gates.md](docs/workflow/gates.md)

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
4. Attach report to PR / tracker per integration flags

**Implementer does not self-validate as formal gate.**

## Documentation

- Repo docs: `{{DOCS_FALLBACK}}`
{{CONFLUENCE_NOTE}}

## Tools

Active: {{TOOLS}}

Installed by AB Harness Skill.
