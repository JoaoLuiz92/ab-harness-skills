# Sample Harness Plan

Example output from harness-bootstrap Phase 4. Fictional project **Acme API**.

## Context

- **Tools:** cursor, codex
- **JIRA_TASKS:** OFF
- **GITHUB_PULL_REQUESTS:** ON
- **CONFLUENCE:** OFF
- **Production:** active on `main`

## Gap report summary

| Pillar | Score | Notes |
|--------|-------|-------|
| Discovery | 1 | README only |
| SDD | 1 | Ad hoc tickets |
| Guard-rails | 0 | No AGENTS.md |
| Test net | 2 | Jest partial |
| CI gate | 3 | GH Actions on PR |
| Validation lane | 0 | None |
| UAT | N/A | API only |

**Overall:** 9/24 — priority: guard-rails, validation lane, SDD minimum

## Rollout plan

### Install now (Phase 5)

- [x] Phase 1 — workflow.config.md, AGENTS.md, docs/workflow/*
- [x] Phase 2 — next_actions.md pattern
- [x] Phase 5 — validation-lane.mjs + lane-commands.json
- [x] Cursor rules (workflow-core, validation-lane, close-delivery-local, create-pr)

### Follow-up tasks

- [ ] Phase 3 — add integration test helper for DB mock (S)
- [ ] Phase 4 — add lint to required CI check (S)
- [ ] Document auth guard-rails in AGENTS.md (M)

## Pilot

**Slug:** `fix-healthcheck-timeout`

1. Spec inline in next_actions
2. Fast loop: `cd backend && npm test -- health`
3. Full validation lane
4. `gh pr create` with report link

## lane-commands.json (installed)

```json
{
  "lintBuild": { "backend": "cd backend && npm run lint && npm run build" },
  "unit": { "backend": "cd backend && npm test -- {{pattern}}" },
  "integration": { "backend": "cd backend && npm test -- {{pattern}}" },
  "e2e": "cd backend && npm run test:e2e",
  "uat": null
}
```

## Approval

- [ ] User approved install — date: _______
