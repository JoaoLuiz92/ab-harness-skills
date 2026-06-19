# Interview Questions

Ask in batches of **3–5**. Maximum **3 rounds** unless critical gaps remain. Document answers in `docs/workflow/bootstrap/context.md`.

## Round 1 — Tools and process

1. Which AI tools does the team use? (`cursor`, `claude`, `codex` — multiple OK)
2. Branch strategy? (e.g. `main` + `develop`, trunk-based, gitflow)
3. Is production active? Can merges break live users?
4. Who approves merge to production?
5. One sentence: what does this project do?

## Round 2 — Integrations (flags)

6. **JIRA_TASKS** — Track work in Jira (or similar)? `ON` / `OFF`
   - If ON: project key? MCP already configured?
7. **GITHUB_PULL_REQUESTS** — Use PRs via GitHub/GitLab? `ON` / `OFF`
   - If ON: `gh` CLI or MCP available?
8. **CONFLUENCE** — Document for whole team on wiki? `ON` / `OFF`
   - If ON: space key? MCP available?

If ON but MCP not ready: record `MCP_PENDING` in `workflow.config.md`.

## Round 3 — Quality and risk

9. What must never regress? (list 2–5 critical flows)
10. Current test confidence: none / low / medium / high?
11. Does CI block merge today? What runs?
12. Database: where is schema? Local dev how?
13. Auth / payments / PII — any guard-rail areas for agents?

## Round 4 — Optional (if complex)

14. Monorepo: which package is the pilot?
15. Existing issue tracker workflow states? (e.g. In Progress → PR Review)
16. Deploy: manual or automatic? Checklist exists?
17. Desired timeline for harness adoption (sprints)?

## Inference rules (do not ask if scan is clear)

| Scan found | Skip question |
|------------|---------------|
| `.github/workflows/ci.yml` with test job | "Does CI exist?" — ask only if blocking |
| `jest` in package.json | Unit runner — confirm pattern only |
| `AGENTS.md` | Ask if team wants to replace or extend |

## After interview

Produce:

- Completed `workflow.config.md` values
- `context.md` with decisions
- Input for gap analysis (maturity-model.md)
