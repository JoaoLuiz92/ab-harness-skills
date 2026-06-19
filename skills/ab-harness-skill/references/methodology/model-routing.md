# Model Routing

Choose model tier by **work type**, not preference.

## Tiers

| Tier | Work | Chat model (guidance) | Subagent slug (if applicable) |
|------|------|----------------------|-------------------------------|
| **S0 — Mechanical** | Runners, merge, lint, grep, boilerplate | Fast / composer class | `composer-2.5-fast` or equivalent |
| **S1 — Implementation** | Code with clear spec | Balanced / sonnet class | medium-thinking implementation |
| **S2 — Planning** | Specify, design, tasks, trade-offs | Strong / opus class | high-thinking planning |
| **S3 — Critical** | Auth, payments, migrations, new architecture | Strongest available | high-thinking critical |

Exact model names vary by provider; map to your tool's available slugs.

## Coordinator rules

1. **Implemented at S1 → validate at S0** — lane runners use mechanical tier.
2. **Planned at S2 → implement at S1** — separate session or model before coding large features.
3. **Escalate to S3** — guard-rails, financial/auth, 2 failures on same problem, new domain.
4. **Descend to S0/S1** — ≤3 files, existing pattern, clear fix.

## TLC phase mapping

| Phase | Typical tier |
|-------|--------------|
| Quick / small fix | S0 |
| Specify, design, tasks | S2 (S3 if critical) |
| Execute | S1 |
| Validation lane runners | S0 |
| Merge | S0 |

## Prohibited

Coordinator at S2/S3 running all lane runners in own shell without isolation — use runners or script-only mode per `workflow.config.md`.
