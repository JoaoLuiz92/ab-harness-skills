# Discovery Checklist

Read-only scan before changing production code. Use with `scripts/scan-profile.mjs` output.

## Repository

- [ ] Git root identified
- [ ] Monorepo vs single package
- [ ] Primary language(s)
- [ ] Package manager (npm, pnpm, yarn, pip, cargo, go mod, etc.)

## Structure

- [ ] Backend path(s)
- [ ] Frontend path(s)
- [ ] Shared packages
- [ ] Database / migrations path
- [ ] Infrastructure (docker, k8s, terraform)

## Build and run

- [ ] Install command
- [ ] Dev start command(s)
- [ ] Production build command(s)
- [ ] Required env vars (from `.env.example` or docs)

## Tests

- [ ] Unit test runner and config
- [ ] Integration test pattern
- [ ] E2E test runner (if any)
- [ ] UI/UAT framework (if any)
- [ ] Coverage command (if any)

## CI/CD

- [ ] CI platform (GitHub Actions, GitLab CI, etc.)
- [ ] Jobs: lint, test, build
- [ ] Blocking vs informational
- [ ] Deploy trigger (manual, push, tag)

## Agent tooling (existing)

- [ ] `AGENTS.md`
- [ ] `CLAUDE.md`
- [ ] `.cursor/rules/`
- [ ] `.claude/rules/`
- [ ] MCP config hints

## Integrations (detect + confirm)

- [ ] Issue tracker mentions (Jira, Linear, etc.)
- [ ] Git hosting (GitHub, GitLab)
- [ ] Wiki mentions (Confluence, Notion)
- [ ] External APIs / auth patterns

## Concerns (record, do not fix)

- [ ] Direct DB access from frontend
- [ ] Secrets in repo history
- [ ] Missing tests on critical paths
- [ ] Non-blocking CI
- [ ] Undocumented deploy process

## Output

Write findings to `docs/workflow/bootstrap/profile.md` in target repo (or `.tmp-profile.md` during plan-only).
