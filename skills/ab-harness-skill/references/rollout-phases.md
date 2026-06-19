# Rollout Phases — Incremental Adoption

Never big-bang. Install only phases needed per gap report.

## Phase 0 — Discovery (read-only)

**Goal:** Map codebase without changing production code.

**Deliverables:**

- `docs/workflow/bootstrap/profile.md`
- Optional: `.specs/codebase/` snapshots (auto-generated at install)

**Done when:** Stack, structure, tests, CI, integrations, concerns documented.

**Prerequisite:** None.

---

## Phase 1 — Memory + guard-rails

**Goal:** Persistent agent instructions.

**Deliverables:**

- `workflow.config.md`
- `AGENTS.md` / `CLAUDE.md`
- `docs/workflow/README.md`
- Tool rules (`.cursor/rules/`, `.claude/rules/`)

**Done when:** Agent reads config + workflow docs at session start.

**Prerequisite:** Phase 0 recommended.

---

## Phase 2 — SDD minimum

**Goal:** Traceable acceptance per delivery.

**Deliverables:**

- `docs/workflow/next_actions.md`
- `.specs/features/<name>/spec.md` pattern

**Done when:** One feature closed with written criteria.

**Prerequisite:** Phase 1.

---

## Phase 3 — Test net

**Goal:** Prove changes before merge.

**Deliverables:**

- Test conventions doc
- Mock/helper patterns for integrations
- Fast-loop commands in `lane-commands.json`

**Done when:** Touched module has runnable focused tests.

**Prerequisite:** Phase 1; tests possible in stack.

---

## Phase 4 — CI blocking

**Goal:** Automation blocks bad merges.

**Deliverables:**

- CI workflow: lint + test + build (as applicable)
- Branch protection (manual Git hosting config)

**Done when:** Red CI blocks merge on integration branch.

**Prerequisite:** Phase 3 partial (tests run in CI).

---

## Phase 5 — Validation lane

**Goal:** Isolated validation + audit report.

**Deliverables:**

- `scripts/validation-lane.mjs`
- `docs/workflow/lane-commands.json`
- `docs/workflow/test-lane.md`
- Runner prompts / rules per tool

**Done when:** One delivery has merge report from lane.

**Prerequisite:** Phase 3 (commands exist); Phase 4 recommended.

---

## Phase 6 — UAT (if UI)

**Goal:** Critical user flows in lane.

**Deliverables:**

- UAT runner command in `lane-commands.json`
- Smoke/critical suite

**Done when:** UAT runner PASS or documented SKIP policy.

**Prerequisite:** Phase 5; frontend or UI exists.

---

## Typical sequencing

```
0 → 1 → 2 → 3 → 4 → 5 → (6)
```

Bootstrap **install** usually delivers Phases 1 + 2 + 5 skeleton; Phases 3–4 may be tasks in `harness-plan.md` if gap scores are low.

## Pilot (after install)

One small delivery validates the harness. See `docs/workflow/pilot-guide.md` in target repo.
