# Spec-Driven Development (SDD) — Adaptive

## Pipeline

```
Specify → Design → Tasks → Execute → Validate
```

| Phase | Always? | Purpose |
|-------|---------|---------|
| **Specify** | Yes | What problem, acceptance criteria, scope — no implementation |
| **Design** | If needed | Architecture, trade-offs, new patterns |
| **Tasks** | If needed | Atomic checkboxes with verification |
| **Execute** | Yes | Implement with per-task gates |
| **Validate** | Yes | Formal validation lane + merge gates |

## Auto-sizing by scope

| Scope | Specify | Design | Tasks | Execute |
|-------|---------|--------|-------|---------|
| **Small** | Quick (one paragraph) | Skip | Skip | Direct |
| **Medium** | Brief spec | Inline | Implicit | Implement + verify |
| **Large** | Full spec + IDs | Architecture doc | Full breakdown | Per task |
| **Complex** | Spec + discuss gray areas | Research + design | Parallel plan | + interactive UAT if UI |

**Rules:**

- Specify and Execute are always required.
- Design skipped when no architectural decisions.
- Tasks skipped when ≤3 obvious steps.
- If Execute reveals >5 steps, stop and create formal tasks.

## Artifacts (target repo)

```
docs/workflow/features/<name>/
├── spec.md       # Requirements
├── design.md     # Optional
└── tasks.md      # Optional
```

Or minimal: criteria inline in `next_actions.md` for small work.

## Traceability

Each acceptance criterion should map to at least one test or gate check before merge.
