---
name: ab-harness-skill
description: Bootstraps a portable AI development harness (spec-driven delivery, isolated validation lane, merge gates, optional Jira/GitHub/Confluence) on any codebase for Cursor, Claude Code, or Codex. Use when the user asks to bootstrap workflow, install harness, set up test lane, validation lane, agent workflow, or SDD on a brownfield repo. Do NOT use for one-off bug fixes, generic code review, CI-only setup without agent methodology, or infrastructure deploys unrelated to agent workflow.
license: MIT
compatibility: Requires Node.js 18+ and git. Optional gh CLI and Atlassian MCP for integrations.
metadata:
  author: JoaoLuiz92
  version: "1.0.0"
---

# AB Harness Skill

Install the **AB Harness** methodology on a target repository. Stack-agnostic. Never copy files wholesale from other projects.

## Instructions

### Step 0: Resolve paths and mode

**Target repo:** the repository where the harness will live. Confirm its root with the user if unclear.

**SKILL_ROOT:** directory containing this `SKILL.md` (after install, e.g. `~/.cursor/skills/ab-harness-skill` or `.agents/skills/ab-harness-skill`). Run `npx skills list` if unsure.

**Mode** (ask if not stated):

| Mode | Writes to target? | Flow |
|------|-------------------|------|
| `plan` | No | Phases 1–4 only; use `.tmp-*` outputs |
| `install` | Yes | Phase 5+ when config/plan already approved |
| `full` | Yes | Phases 1–6; **STOP at Phase 4** for approval |

Before Phase 1, read [references/methodology/sdd.md](references/methodology/sdd.md) for methodology context.

### Phase 1: Scan (read-only)

Run the bundled scanner against the **target repo**:

```bash
node "$SKILL_ROOT/scripts/scan-profile.mjs" --cwd <target-repo> --out docs/workflow/bootstrap/profile.md
```

In `plan` mode when `docs/` must not exist yet: `--out .tmp-harness-profile.md`.

Also read target README, package manifests, CI workflows, and any `AGENTS.md` / `CLAUDE.md`.

Apply checklist: [references/discovery-checklist.md](references/discovery-checklist.md)

**Validation:** profile file exists and lists stack, test commands, and branch hints.

**On failure:** fix Node path or `--cwd`; re-run scan. Do not proceed without a profile.

### Phase 2: Interview

Use [references/interview-questions.md](references/interview-questions.md) — max 3 rounds, 3–5 questions each.

**Required answers:**

- `TOOLS`: cursor, claude, codex (comma-separated subset)
- `JIRA_TASKS`, `GITHUB_PULL_REQUESTS`, `CONFLUENCE`: ON or OFF
- Branch strategy, production risk, critical flows

Write `docs/workflow/bootstrap/context.md` (or `.tmp-harness-context.md` in `plan` mode).

**Validation:** all required flags captured with explicit ON/OFF.

**On failure:** ask missing questions; do not invent defaults for integrations.

### Phase 3: Gap analysis

Score pillars 0–4 using [references/maturity-model.md](references/maturity-model.md).

Output: `docs/workflow/bootstrap/gap-report.md`

**Validation:** each pillar has score + one-line rationale.

### Phase 4: Plan

Apply [references/rollout-phases.md](references/rollout-phases.md) to gaps.

Output:

- `docs/workflow/bootstrap/harness-plan.md`
- `docs/workflow/bootstrap/tasks.md` (checkboxes)

**STOP.** Present plan summary and ask user to approve before Phase 5.

**On skip attempt:** explain that install modifies repo structure; offer `plan` mode instead.

### Phase 5: Install

Copy and parameterize templates from `$SKILL_ROOT/templates/` into the target repo, or run the installer:

```bash
node "$SKILL_ROOT/scripts/install-harness.mjs" --config <target-repo>/my-install.json --target <target-repo>
```

| Template | Target |
|----------|--------|
| `workflow.config.md.tpl` | `workflow.config.md` |
| `AGENTS.md.tpl` | `AGENTS.md` (merge if exists — append Workflow section) |
| `CLAUDE.md.tpl` | `CLAUDE.md` (if `claude` in TOOLS) |
| `docs/workflow/*.tpl` | `docs/workflow/` |
| `scripts/validation-lane.mjs.tpl` | `scripts/validation-lane.mjs` |
| `docs/workflow/lane-commands.json.tpl` | `docs/workflow/lane-commands.json` |
| `package.json.scripts.fragment` | merge into root `package.json` scripts |
| `adapters/cursor/rules/*` | `.cursor/rules/` if cursor in TOOLS |
| `adapters/claude/rules/*` | `.claude/rules/` if claude in TOOLS |
| `adapters/codex/config.toml.example` | `.codex/config.toml.example` if codex in TOOLS |

After templates, run `generate-specs.mjs` (also invoked by installer) to map the codebase into `.specs/`:

| Generated | Target |
|-----------|--------|
| scan profile data | `.specs/codebase/overview.md`, `structure.md`, `stack.md` |
| install config | `.specs/project/context.md` |
| templates | `.specs/README.md`, `features/`, `quick/`, `testing/strategy.md` |

Replace `{{KEY}}` placeholders from scan + interview.

**Conditional rules:** install Jira/PR/Confluence rules only when flag ON — see [references/mcp-matrix.md](references/mcp-matrix.md).

**lane-commands.json:** derive commands from scan (npm test, pytest, go test, etc.).

Default flags when not specified:

```
VALIDATION_CURSOR=subagents       (if cursor in TOOLS)
VALIDATION_CLAUDE=multi-session   (if claude in TOOLS)
VALIDATION_CODEX=script-only      (if codex in TOOLS)
TASKS_FALLBACK=docs/workflow/next_actions.md
DOCS_FALLBACK=docs/
SPECS_DIR=.specs
INTEGRATION_BRANCH=develop
PRODUCTION_BRANCH=main
MCP_STATUS=PENDING
```

**Validation:** `workflow.config.md` exists; `.specs/codebase/overview.md` exists; selected tool adapters present; `npm run validation-lane:handoff -- --help` works if Node project.

### Phase 6: Pilot

Walk user through [templates/docs/workflow/pilot-guide.md.tpl](templates/docs/workflow/pilot-guide.md.tpl).

First delivery: small bugfix or single module; run full validation lane; calibrate `lane-commands.json` if runners fail.

**Post-install validation lane:** coordinator must not self-validate. Read the adapter for active tool only:

- Cursor: [references/adapters/cursor.md](references/adapters/cursor.md)
- Claude: [references/adapters/claude.md](references/adapters/claude.md)
- Codex: [references/adapters/codex.md](references/adapters/codex.md)

Methodology: [references/methodology/test-lane.md](references/methodology/test-lane.md)

## Examples

### Example 1: Full bootstrap on a brownfield Node repo

User says: "Bootstrap agent workflow on this repo with Cursor and GitHub PRs."

Actions:

1. Set mode `full`; resolve SKILL_ROOT and target repo root.
2. Run scan → interview (TOOLS=cursor; GITHUB_PULL_REQUESTS=ON; others OFF).
3. Gap report + phased plan → **stop for approval**.
4. After approval, install templates + merge lane scripts.
5. Pilot: one small change through validation lane.

Result: target repo has `workflow.config.md`, `.specs/`, `docs/workflow/`, `.cursor/rules/`, and a passing pilot report under `docs/workflow/reports/`.

### Example 2: Plan only (no repo writes)

User says: "Show me what harness we'd need — don't change files yet."

Actions: mode `plan`; Phases 1–4 with `.tmp-harness-*.md` outputs; present plan and exit.

Result: user receives gap report and harness-plan without modified production tree.

### Example 3: Install after an approved plan

User says: "Plan approved — install the harness now."

Actions: mode `install`; verify prior plan/context exists; Phase 5 → Phase 6.

Result: same artifacts as Example 1 without repeating interview if context is still valid.

## Troubleshooting

### Error: scan-profile exits non-zero

Cause: wrong Node version, bad `--cwd`, or unreadable target repo.

Solution: require Node 18+; pass absolute `--cwd`; confirm git repo root.

### Error: validation-lane runner fails after install

Cause: `lane-commands.json` does not match project test stack.

Solution: re-read scan profile; edit `docs/workflow/lane-commands.json`; re-run pilot with `--runner lint-build` first.

### Error: MCP integration ON but tools unavailable

Cause: `JIRA_TASKS=ON` or `CONFLUENCE=ON` without MCP configured.

Solution: set flag OFF and use fallbacks, or set `MCP_STATUS=PENDING` and point user to installed `docs/workflow/mcp-setup.md`.

### User wants to skip Phase 4 approval

Cause: urgency vs. safety tradeoff.

Solution: refuse `full`/`install` until explicit approval; offer `plan` or a minimal Phase-5 subset documented in harness-plan.

## Reference map (load on demand)

| Resource | Read when |
|----------|-----------|
| [references/methodology/](references/methodology/) | Explaining SDD, gates, or loops to the user |
| [references/maturity-model.md](references/maturity-model.md) | Phase 3 scoring |
| [references/rollout-phases.md](references/rollout-phases.md) | Phase 4 planning |
| [references/mcp-matrix.md](references/mcp-matrix.md) | Toggling Jira/GitHub/Confluence |
| [references/adapters/](references/adapters/) | Post-install validation execution per tool |

## Anti-patterns

- Copying files from other projects wholesale
- Installing all rollout phases day one
- ON flags without documenting MCP setup
- Hand-written lane reports without merge script
- Self-validating as coordinator (violates test-lane isolation)
