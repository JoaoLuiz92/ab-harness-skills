# Feature specs

One folder per non-trivial delivery:

```
.specs/features/<slug>/
├── spec.md       # Required — problem + acceptance criteria
├── design.md     # Optional — architecture / trade-offs
└── tasks.md      # Optional — atomic checkboxes
```

## spec.md template

```markdown
# <Title>

## Problem
One paragraph.

## Acceptance criteria
- [ ] Criterion 1 (testable)
- [ ] Criterion 2

## Out of scope
- ...
```

## When to use

| Scope | Path |
|-------|------|
| Small | `.specs/quick/` or `next_actions.md` |
| Medium+ | `.specs/features/<slug>/` |

Close delivery per [docs/workflow/test-lane.md](../../docs/workflow/test-lane.md).
