# Feature specs

One folder per non-trivial delivery:

```
.specs/features/<slug>/
├── spec.md       # Required — problem + acceptance criteria
├── design.md     # Optional — architecture / trade-offs
├── tasks.md      # Optional — atomic checkboxes
└── delivery.md   # Required at close (medium+) — see delivery.md.tpl
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

## delivery.md (required for medium+)

Copy [delivery.md.tpl](delivery.md.tpl) to `<slug>/delivery.md` before merge. Eight sections:

1. Identification
2. Summary (plain language)
3. Scope delivered
4. Verification (commands + lane report)
5. Documentation
6. Confluence / wiki (if `CONFLUENCE=ON`)
7. Risks and follow-ups
8. Technical reference

Close delivery per [docs/workflow/test-lane.md](../../docs/workflow/test-lane.md) and adapter close-delivery rules.

## When to use

| Scope | Path | delivery.md |
|-------|------|-------------|
| Small | `.specs/quick/` or `NEXT-ACTIONS.md` | Optional |
| Medium+ | `.specs/features/<slug>/` | **Required** |
