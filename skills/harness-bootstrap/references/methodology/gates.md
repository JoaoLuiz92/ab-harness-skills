# Merge Gates

Objective criteria before each merge type. Adjust branch names to your repo in `workflow.config.md`.

## Gate 1 — Feature → integration branch

Required:

- [ ] Lint green (if configured)
- [ ] Build green
- [ ] Unit tests green for touched area
- [ ] Integration tests green (if area has them)
- [ ] CI green on PR (if CI exists)
- [ ] Validation lane report attached
- [ ] Scope = one feature or refactor
- [ ] Docs updated if API/routes/migrations/env changed

## Gate 2 — Integration → production branch

Everything in Gate 1, plus:

- [ ] E2E / critical API flows green
- [ ] UAT critical flows green (if UI project)
- [ ] Deploy checklist complete
- [ ] Human release approval
- [ ] Project state doc reflects what ships

## Gate 3 — Hotfix → production

- [ ] Minimal focused fix with test covering bug
- [ ] Lint/build/test green in affected area
- [ ] Proportional deploy checklist
- [ ] Post-deploy smoke
- [ ] Sync back to integration branch recorded

## Failure policy

- Any required red item **blocks** merge.
- Fix at source; no silent test skips without documented reason.
- Exceptions need explicit human approval on PR or tracker.

## Lane vs CI

- **CI** = automated gate on push/PR (second line of defense).
- **Validation lane** = structured evidence before opening PR; implementer ≠ validator.

Both can be required; they complement each other.
