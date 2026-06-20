# Discovery Checklist

Read-only scan before changing production code. Use with `scripts/scan-profile.mjs` + `scripts/map-codebase.mjs` output.

Each item maps to a target doc in `docs/workflow/bootstrap/codebase/` (or `.tmp-harness-codebase/` in plan mode).

## Repository → DISCOVERY, STACK

- [ ] Git root identified → STRUCTURE
- [ ] Monorepo vs single package → STRUCTURE
- [ ] Primary language(s) → STACK
- [ ] Package manager (npm, pnpm, yarn, pip, cargo, go mod, etc.) → STACK

## Structure → STRUCTURE, ARCHITECTURE

- [ ] Backend path(s) → STRUCTURE
- [ ] Frontend path(s) → STRUCTURE
- [ ] Shared packages → STRUCTURE
- [ ] Database / migrations path → STRUCTURE
- [ ] Infrastructure (docker, k8s, terraform) → STACK, STRUCTURE

## Build and run → STACK

- [ ] Install command → STACK
- [ ] Dev start command(s) → STACK
- [ ] Production build command(s) → STACK
- [ ] Required env vars (from `.env.example` or docs) → INTEGRATIONS

## Tests → TESTING

- [ ] Unit test runner and config → TESTING
- [ ] Integration test pattern → TESTING
- [ ] E2E test runner (if any) → TESTING
- [ ] UI/UAT framework (if any) → TESTING
- [ ] Coverage command (if any) → TESTING

## CI/CD → STACK, TESTING, CONCERNS

- [ ] CI platform (GitHub Actions, GitLab CI, etc.) → STACK
- [ ] Jobs: lint, test, build → TESTING
- [ ] Blocking vs informational → CONCERNS
- [ ] Deploy trigger (manual, push, tag) → CONCERNS

## Agent tooling (existing) → DISCOVERY

- [ ] `AGENTS.md`
- [ ] `CLAUDE.md`
- [ ] `.cursor/rules/`
- [ ] `.claude/rules/`
- [ ] MCP config hints

## Integrations (detect + confirm) → INTEGRATIONS

- [ ] Issue tracker mentions (Jira, Linear, etc.)
- [ ] Git hosting (GitHub, GitLab)
- [ ] Wiki mentions (Confluence, Notion)
- [ ] External APIs / auth patterns → ARCHITECTURE, CONVENTIONS

## Concerns (record, do not fix) → CONCERNS

- [ ] Direct DB access from frontend
- [ ] Secrets in repo history
- [ ] Missing tests on critical paths
- [ ] Non-blocking CI
- [ ] Undocumented deploy process

## Output

| Artifact | Phase |
|----------|-------|
| `docs/workflow/bootstrap/profile.md` + `profile.json` | 1a (scan) |
| `docs/workflow/bootstrap/codebase/*.md` (8 files) | 1a scaffold + 1b enrichment |

Gate: `DISCOVERY.md` gate **passed** before Q5 — ≥80% of **applicable** checklist items (`[~]` = N/A, not counted). Harness-only repos use the harness gate (see `codebase-mapping-protocol.md`).
