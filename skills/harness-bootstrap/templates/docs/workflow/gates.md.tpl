# Merge Gates (local reference)

## Gate 1 — Feature → {{INTEGRATION_BRANCH}}

- Lint / build / unit / integration green
- CI green on PR
- Validation lane report APROVADO attached
- Docs updated if contracts changed

## Gate 2 — {{INTEGRATION_BRANCH}} → {{PRODUCTION_BRANCH}}

- Gate 1 +
- E2E critical green
- UAT critical green (if UI)
- Deploy checklist + human approval

## Gate 3 — Hotfix → {{PRODUCTION_BRANCH}}

- Minimal fix + test
- Smoke after deploy
- Sync back to {{INTEGRATION_BRANCH}}

See harness skill `references/methodology/gates.md` for full policy.
