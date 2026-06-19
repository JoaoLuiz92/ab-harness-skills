# Maturity Model — 7 Pillars

Score each pillar **0–4** during gap analysis.

| Score | Meaning |
|-------|---------|
| 0 | Absent |
| 1 | Ad hoc / partial |
| 2 | Documented, inconsistently applied |
| 3 | Automated or enforced most of the time |
| 4 | Measured, team habit, continuous improvement |

## Pillars

### 1. Discovery

**Question:** Is there a reliable map of the codebase before refactoring?

| 0 | No map; knowledge in heads only |
| 1 | README only |
| 2 | Partial docs (stack OR architecture) |
| 3 | Structured discovery docs (stack, arch, tests, concerns) |
| 4 | Kept current; agents read first |

### 2. SDD

**Question:** Does meaningful work have traceable acceptance criteria?

| 0 | No specs |
| 1 | Issues/tickets only |
| 2 | Some features have criteria |
| 3 | Spec/tasks pattern for features |
| 4 | Criteria map to tests; sizing habitual |

### 3. Guard-rails

**Question:** Do agents have explicit persistent limits?

| 0 | None |
| 1 | Informal README notes |
| 2 | AGENTS.md exists |
| 3 | AGENTS + tool-specific rules |
| 4 | Guard-rails reviewed; violations caught in review |

### 4. Test net

**Question:** Can you prove correctness without manual production checks?

| 0 | No tests |
| 1 | Few tests, not trusted |
| 2 | Tests exist; partial coverage |
| 3 | CI runs tests; mocks/helpers for integrations |
| 4 | Critical paths covered; coverage tracked |

### 5. CI gate

**Question:** Does red CI block merge?

| 0 | No CI |
| 1 | CI informational |
| 2 | CI on main only |
| 3 | CI on PRs; lint/test/build |
| 4 | Full matrix; required checks on branch protection |

### 6. Validation lane

**Question:** Is formal validation isolated from implementer?

| 0 | Implementer says "I tested" |
| 1 | Ad hoc test commands in PR |
| 2 | Checklist in PR template |
| 3 | Lane script + report template |
| 4 | Isolated runners + merge evidence; anti-patterns enforced |

### 7. UAT (conditional)

**Question:** Are critical user flows verified beyond unit/e2e?

N/A if no UI — mark `N/A` and skip from total.

| 0 | No UI verification |
| 1 | Manual only |
| 2 | Ad hoc browser testing |
| 3 | Automated UI smoke |
| 4 | Smart/full UAT in lane + release gate |

## Gap report output

```markdown
| Pillar | Score | Notes |
|--------|-------|-------|
| Discovery | 2 | ... |
...
**Overall:** 14/28 (exclude UAT if N/A)
**Priority:** Test net, Validation lane
```
