# Pilot Guide — First Harness Delivery

Calibrate the harness with one **small** delivery before team-wide rollout.

## 1. Choose scope

Pick one of:

- Single-module bugfix
- Small API endpoint + test
- UI tweak with existing test pattern

**Avoid:** large refactor, new architecture, multi-package changes.

## 2. Specify (minimal)

Create `docs/workflow/features/<slug>/spec.md`:

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

Or inline criteria in `next_actions.md` for tiny fixes.

## 3. Implement

- Touch only files required
- **Fast loop** after each logical step
- One atomic commit per logical step (optional but recommended)

## 4. Validation lane

```bash
npm run validation-lane:handoff -- --name <slug> --pattern "<p>" --area "<path>"
# Run 5 runners (see test-lane.md)
npm run validation-lane:merge -- --name <slug>
```

## 5. Close

| Config | Action |
|--------|--------|
| JIRA_TASKS=ON | Comment on card; link `docs/workflow/reports/<date>-<slug>.md` |
| GITHUB_PULL_REQUESTS=ON | Open PR with report link |
| CONFLUENCE=ON | Update wiki if team-facing |
| All OFF | Complete merge-checklist.md |

## 6. Calibrate

If a runner failed due to **wrong command** (not code):

1. Edit `docs/workflow/lane-commands.json`
2. Re-run failed runner only
3. Re-merge
4. Note change in `docs/workflow/bootstrap/pilot-notes.md`

## Success criteria for pilot

- [ ] Handoff JSON exists
- [ ] 5 runner JSON files existed
- [ ] Merge report says APROVADO
- [ ] Delivery closed per integration flags
- [ ] Team agrees commands are correct

## Next

Execute remaining tasks in `docs/workflow/bootstrap/harness-plan.md`.
