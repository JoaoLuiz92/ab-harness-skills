---
name: ab-harness-skill
description: Bootstraps a portable AI development harness (spec-driven delivery, isolated validation lane, merge gates, optional Jira/GitHub/Confluence) on any codebase for Cursor, Claude Code, or Codex. Use when the user asks to bootstrap workflow, install harness, set up test lane, validation lane, agent workflow, or SDD on a brownfield repo. Do NOT use for one-off bug fixes, generic code review, CI-only setup without agent methodology, or infrastructure deploys unrelated to agent workflow.
license: MIT
compatibility: Requires Node.js 18+ and git. Optional gh CLI and Atlassian MCP for integrations.
metadata:
  author: JoaoLuiz92
  version: "1.1.0"
---

# AB Harness Skill

Install the **AB Harness** methodology on a target repository. Stack-agnostic. Never copy files wholesale from other projects.

Methodology informed by **[Tech Leads Club (TLC)](https://techleads.club/)** [Agent Skills](https://agent-skills.techleads.club/) — see [CREDITS.md](CREDITS.md).

## Instructions

### Default flow (first-time users)

When the user asks to bootstrap, install, or set up the harness **without** saying otherwise, use mode **`full`** automatically. **Do not ask Q1** — go straight to Q0 and the interview.

Explain once in the user's `LANGUAGE`:

> **Parte A — Preparação:** leio o projeto, faço o questionário, gero o plano.  
> **Você aprova** na caixa de perguntas.  
> **Parte B — Instalação:** monto toda a estrutura no repositório.  
> **Parte C — Piloto (opcional):** primeira entrega guiada.

```
Q0 idioma → Q2–Q4 questionário → Parte A (fases 1–4) → resumo → Q5 aprovação → Parte B (fase 5) → Parte C (fase 6)
```

| Mode | When to use | Writes harness structure? |
|------|-------------|---------------------------|
| `full` | **Default** — user says bootstrap / install harness | Part B only (after Q5 `approve_install`) |
| `plan` | User explicitly says plan only / no file changes | Never — use `.tmp-harness-*.md` |
| `install` | User says plan already approved / install now | Part B immediately (verify bootstrap artifacts) |

**Ask Q1 only** when the user message is ambiguous between `full`, `plan`, and `install`.

### Interaction rules (mandatory)

- **Every** user question goes through **AskQuestion** — never a numbered list or open questions in chat.
- One AskQuestion call per round; wait for answers before the next round.
- Infer from README, scan, and manifests **before** asking; skip questions the scan already answers.
- Free-text fields (project one-liner, critical flows): infer from docs first; if still missing, one AskQuestion with concrete options plus `other` — never multi-question chat dumps.
- Summaries and explanations in the user's `LANGUAGE`; paths, flags, and commands stay in English.

### Step 0: Language and paths

**Language (always first):** **AskQuestion** **Q0** — see [references/interaction-questionnaire.md](references/interaction-questionnaire.md). Store `LANGUAGE` for all user-facing text.

**Target repo:** where the harness will live. If unclear, **AskQuestion** **Q0b** (current workspace vs other). Default: Cursor workspace root.

**SKILL_ROOT:** directory containing this `SKILL.md`. Run `npx skills list` if unsure.

Before Phase 1, read [references/methodology/sdd.md](references/methodology/sdd.md) for methodology context.

### Part A — Prepare (Phases 1–4) — stop before install

**Goal:** understand the repo and produce an approved plan. **Do not** install harness structure yet (no `.specs/`, `.cursor/rules/`, `workflow.config.md`, `validation-lane.mjs`, etc.).

**Part A deliverables (all required before Q5):**

| File | Phase |
|------|-------|
| `docs/workflow/bootstrap/profile.md` | 1 |
| `docs/workflow/bootstrap/context.md` | 2 |
| `docs/workflow/bootstrap/gap-report.md` | 3 |
| `docs/workflow/bootstrap/harness-plan.md` | 4 |
| `docs/workflow/bootstrap/tasks.md` | 4 |

In `plan` mode, write the same content to `.tmp-harness-profile.md`, `.tmp-harness-context.md`, etc. at repo root instead.

**Gate:** if any Part A file is missing, complete that phase — do not show Q5 or start Part B.

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

Use **AskQuestion** for each round — see [references/interaction-questionnaire.md](references/interaction-questionnaire.md) and [references/interview-questions.md](references/interview-questions.md). Max 3 rounds, 3–5 select questions each; free-text only where the questionnaire says so.

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

**STOP — end of Part A.** Present a **short, plain-language** summary (what was found, maturity scores, what Part B will create). Then **AskQuestion Q5** only — see [references/interaction-questionnaire.md](references/interaction-questionnaire.md).

| Q5 answer | Next step |
|-----------|-----------|
| `approve_install` | Part B — Phase 5 (full structure) → Part C — Phase 6 |
| `approve_plan_only` | Stop; user can return with `install` later |
| `request_changes` | Revise plan/tasks → re-ask Q5 |
| `cancel` | Stop |

**On skip attempt:** refuse Part B; explain that install changes repo structure; offer `approve_plan_only`.

### Part B — Install (Phase 5)

**Start only after** Q5 = `approve_install` **and** all five Part A files exist.

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

**Post-install checklist (verify before telling the user Part B is done):**

- [ ] `workflow.config.md` exists
- [ ] `.specs/codebase/overview.md` exists
- [ ] Tool adapters installed for each entry in `TOOLS`
- [ ] Root `package.json` exists with `validation-lane:*` and `specs:refresh` scripts (create minimal root `package.json` if the repo has none — e.g. .NET-only monorepos)
- [ ] `npm run validation-lane:handoff -- --name smoke` succeeds (or document `node scripts/validation-lane.mjs` if npm unavailable)

Tell the user in plain language what was created and where to start (`AGENTS.md`, `docs/workflow/README.md`).

### Part C — Pilot (Phase 6)

Walk user through [templates/docs/workflow/pilot-guide.md.tpl](templates/docs/workflow/pilot-guide.md.tpl).

First delivery: small bugfix or single module; run full validation lane; calibrate `lane-commands.json` if runners fail.

**Post-install validation lane:** coordinator must not self-validate. Read the adapter for active tool only:

- Cursor: [references/adapters/cursor.md](references/adapters/cursor.md)
- Claude: [references/adapters/claude.md](references/adapters/claude.md)
- Codex: [references/adapters/codex.md](references/adapters/codex.md)

Methodology: [references/methodology/test-lane.md](references/methodology/test-lane.md)

## Examples

### Example 1: First-time bootstrap (default)

User says: "Quero instalar o harness neste projeto."

Actions:

1. Mode `full` — **no Q1**.
2. AskQuestion Q0 (idioma) → Q2–Q4 (entrevista).
3. Parte A: scan + `context.md` + `gap-report.md` + `harness-plan.md` + `tasks.md`.
4. Resumo simples → AskQuestion Q5 → **parar** até `approve_install`.
5. Parte B: install completo + `package.json` na raiz se necessário.
6. AskQuestion Q6 — piloto agora ou depois.

Result: usuário só vê caixas de pergunta; estrutura aparece **depois** da aprovação.

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
| [references/interaction-questionnaire.md](references/interaction-questionnaire.md) | Language, interview, and approval AskQuestion flows |
| [references/mcp-matrix.md](references/mcp-matrix.md) | Toggling Jira/GitHub/Confluence |
| [CREDITS.md](CREDITS.md) | TLC and contributor attribution |
| [references/adapters/](references/adapters/) | Post-install validation execution per tool |

## Anti-patterns

- Asking the user questions in chat instead of **AskQuestion**
- Skipping Part A artifacts (context, gap-report, harness-plan) and jumping to install
- Starting Part B before Q5 `approve_install`
- Copying files from other projects wholesale
- Installing all rollout phases day one
- ON flags without documenting MCP setup
- Hand-written lane reports without merge script
- Self-validating as coordinator (violates test-lane isolation)
- Leaving docs referencing `npm run validation-lane:*` without root `package.json` scripts
