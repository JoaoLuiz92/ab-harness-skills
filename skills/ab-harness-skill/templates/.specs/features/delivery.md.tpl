# Delivery — [<slug>] — <Title>

> Copy to `.specs/features/<slug>/delivery.md` when closing a **medium+** feature. Required before merge.

---

## 1. Identification

| Field | Value |
|-------|-------|
| **Tracker** | {{TRACKER_ID_OR_SLUG}} |
| **Type** | Feature / Fix / Refactor |
| **Spec** | `.specs/features/<slug>/` |
| **Branch** | `{{INTEGRATION_BRANCH}}` |
| **PR** | _link or pending_ |
| **Gate** | Validation lane |
| **Date** | {{DELIVERY_DATE}} |
| **Owner** | _agent / human_ |

---

## 2. Summary (for tracker and review)

_One short paragraph in plain language — what changed and why._

---

## 3. Scope delivered

- [ ] _Acceptance criterion 1_
- [ ] _Acceptance criterion 2_

---

## 4. Verification

### Commands run

```text
{{TEST_CMD}}
{{BUILD_CMD}}
npm run validation-lane:merge -- --name <slug>
```

### Result

- [ ] Tests passed
- [ ] Lint / build passed (if applicable)
- [ ] Validation lane **APROVADO** — report: `docs/workflow/reports/<date>-<slug>.md`

---

## 5. Documentation

- [ ] README / `{{DOCS_FALLBACK}}` updated — or N/A with reason
- [ ] Env examples updated — or N/A

---

## 6. Confluence / wiki (if enabled)

{{CONFLUENCE_DELIVERY_SECTION}}

---

## 7. Risks and follow-ups

| Item | Severity | Action / owner |
|------|----------|----------------|
| _None_ | — | — |

- [ ] No blocking follow-ups for this delivery

---

## 8. Technical reference

_Files, modules, contracts changed — for reviewers and future agents._

- _List key paths_
