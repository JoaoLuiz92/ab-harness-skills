# STATE — Current project snapshot (brownfield)

> Snapshot of real project state at bootstrap. Update when relevant roadmap items or architecture decisions change.

Snapshot date: {{BOOTSTRAP_DATE}} · Integration branch: `{{INTEGRATION_BRANCH}}`.

### AD-001: Harness bootstrap installed ({{BOOTSTRAP_DATE}})

**Decision:** Adopt AB Harness (SDD + validation lane) on this repository.
**Reason:** Traceable deliveries, isolated validation, merge gates before production.
**Trade-off:** More process overhead on small fixes; use `.specs/quick/` for tiny scope.
**Impact:** Session starts at `.specs/quick/CURRENT-FOCUS.md`; medium+ features require `delivery.md`.

_Add new AD-xxx blocks below as decisions are made — format: Decision / Reason / Trade-off / Impact._

## Brownfield snapshot

_Summarize stack, maturity, and risks — link to codebase docs rather than duplicating._

| Area | Status | Reference |
|------|--------|-----------|
| Stack | _See scan_ | [codebase/STACK.md](../codebase/STACK.md) |
| Architecture | _See scan_ | [codebase/ARCHITECTURE.md](../codebase/ARCHITECTURE.md) |
| Tests / CI | _See scan_ | [codebase/TESTING.md](../codebase/TESTING.md) |
| Integrations | _See scan_ | [codebase/INTEGRATIONS.md](../codebase/INTEGRATIONS.md) |
| Risks | _See scan_ | [codebase/CONCERNS.md](../codebase/CONCERNS.md) |

## Milestones

Track high-level progress. Check off when done; link to feature folder or lane report.

- [ ] **M1 — Foundation ready** — `.specs/` complete + discovery gate passed + docs aligned
- [ ] **M2 — Safety net** — tests runnable in CI or local loop; validation lane calibrated
- [ ] **M3 — First medium+ delivery** — feature closed with `delivery.md` + lane report APROVADO
- [ ] **M4 — Production-ready process** — deploy plan exercised or production promotion policy agreed

_Add project-specific milestones (M5, M6, …) as needed._

## Where to continue

See [.specs/quick/CURRENT-FOCUS.md](../quick/CURRENT-FOCUS.md) and [.specs/quick/NEXT-ACTIONS.md](../quick/NEXT-ACTIONS.md).
