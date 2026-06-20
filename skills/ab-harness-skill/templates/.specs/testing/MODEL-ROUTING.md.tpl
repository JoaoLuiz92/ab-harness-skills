# Model routing — {{PROJECT_NAME}}

> Choose model tier by **work type**, not preference. Methodology: harness skill `references/methodology/model-routing.md`.

## Tiers

| Tier | Work | Cursor guidance | When |
|------|------|-----------------|------|
| **S0 — Mechanical** | Runners, merge, lint, grep, boilerplate | `composer-2.5-fast` or fast equivalent | Validation lane runners, merge script |
| **S1 — Implementation** | Code with clear spec | Balanced / medium-thinking | Execute tasks, coordinator handoff + merge |
| **S2 — Planning** | Specify, design, tasks, trade-offs | Strong / high-thinking | New features, architecture choices |
| **S3 — Critical** | Auth, payments, migrations, new architecture | Strongest available | Escalate only when needed |

Exact slugs vary by provider; map to models available in your tool.

## Coordinator rules

1. **Implemented at S1 → validate at S0** — lane runners use mechanical tier only.
2. **Planned at S2 → implement at S1** — separate session before large coding blocks.
3. **Escalate to S3** — auth/financial data, migrations, 2 failures on same problem, new domain.
4. **Descend to S0/S1** — ≤3 files, existing pattern, clear fix.

## Phase mapping (GIA)

| Phase | Tier | Doc |
|-------|------|-----|
| Session start / quick fix | S0–S1 | [CURRENT-FOCUS](../quick/CURRENT-FOCUS.md) |
| Specify, design, tasks | S2 (S3 if critical) | [features/](../features/) |
| Execute | S1 | Active spec / tasks |
| Validation lane runners | **S0** | [SUBAGENTS-FLOW.md](SUBAGENTS-FLOW.md) |
| Handoff + merge (coordinator) | **S1** | [TEST-LANE-CLI.md](TEST-LANE-CLI.md) |

## Prohibited

- Coordinator at S2/S3 running all lane runners in own shell without Task isolation.
- Runners reading full feature specs — see [CONTEXT-BOUNDARIES.md](CONTEXT-BOUNDARIES.md).

## Tool modes

From [workflow.config.md](../../workflow.config.md):

| Tool | Validation mode |
|------|-----------------|
| Cursor | {{VALIDATION_CURSOR}} |
| Claude | {{VALIDATION_CLAUDE}} |
| Codex | {{VALIDATION_CODEX}} |
