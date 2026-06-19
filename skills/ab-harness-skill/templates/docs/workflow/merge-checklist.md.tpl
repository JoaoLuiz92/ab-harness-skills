# Merge Checklist

Use when `GITHUB_PULL_REQUESTS=OFF` or before manual merge.

## Pre-merge

- [ ] Validation lane report: `docs/workflow/reports/<date>-<slug>.md` — **APROVADO**
- [ ] Lint / build green (if configured)
- [ ] Tests green for touched area
- [ ] CI green (if exists)
- [ ] Docs updated if API / routes / migrations / env changed
- [ ] Scope = one feature or fix

## Branch

- [ ] Branch: `feature/<slug>` → `{{INTEGRATION_BRANCH}}`
- [ ] Commits are atomic and message is clear

## After merge

- [ ] Delete or archive feature branch
- [ ] Update [next_actions.md](next_actions.md) or tracker

## Production (`{{PRODUCTION_BRANCH}}`)

Gate 2 extras:

- [ ] E2E / critical flows green
- [ ] UAT critical green (if UI)
- [ ] Deploy checklist complete
- [ ] Human release approval
