# DEPLOY-PLAN — Gate before merge to `{{PRODUCTION_BRANCH}}`

> **`{{PRODUCTION_BRANCH}}` is production** (or the branch you treat as production). Do not merge without this checklist.

## When this plan applies

- Promotion `{{INTEGRATION_BRANCH}}` → `{{PRODUCTION_BRANCH}}` (release)
- Hotfix branches → `{{PRODUCTION_BRANCH}}` (urgent production fix)

_Adjust if your team uses a different promotion model — document the active mode below._

## Current mode

_Document team policy: e.g. integration-only phase, manual deploy, CI auto-deploy._

- Integration branch: `{{INTEGRATION_BRANCH}}`
- Production branch: `{{PRODUCTION_BRANCH}}`
- Deploy mechanism: _Unknown — fill from bootstrap interview (CI workflow, manual, PaaS, etc.)_

## Pre-merge checklist (required)

### Quality and tests

- [ ] Project test command green: `{{TEST_CMD}}`
- [ ] Build green: `{{BUILD_CMD}}`
- [ ] Validation lane report **APROVADO** for this delivery
- [ ] Merge gates in [docs/workflow/gates.md](../../docs/workflow/gates.md) satisfied

### Security and configuration

- [ ] No secrets committed (`.env` gitignored; only `.env.example` in repo)
- [ ] New env vars documented in README / `.env.example`
- [ ] Auth / permission changes reviewed

### Documentation

- [ ] README / `{{DOCS_FALLBACK}}` updated if behavior changed
{{CONFLUENCE_DEPLOY_NOTE}}

## Release procedure (`{{INTEGRATION_BRANCH}}` → `{{PRODUCTION_BRANCH}}`)

1. Ensure `{{INTEGRATION_BRANCH}}` is green (tests + lane report).
2. Open PR with this checklist copied into the PR body.
3. Human review approves the checklist.
4. Merge to `{{PRODUCTION_BRANCH}}`.
5. Run deploy (per team runbook).
6. Smoke test post-deploy (below).
7. Record release in [.specs/quick/NEXT-ACTIONS.md](../quick/NEXT-ACTIONS.md).

## Post-deploy smoke test

- [ ] App / API reachable in production (or staging if prod frozen)
- [ ] Login or primary entry flow works
- [ ] One recently changed critical flow works
- [ ] Logs show no boot errors

## Rollback

_Document team rollback procedure — revert commit, redeploy previous artifact, DB migration rollback if applicable._

_No automated rollback assumed until documented._
