---
name: ab-harness-skill
description: Bootstraps a portable AI development harness (spec-driven delivery, isolated validation lane, merge gates, optional Jira/GitHub/Confluence) on any codebase for Cursor, Claude Code, or Codex. Use when the user asks to bootstrap workflow, install harness, set up test lane, validation lane, agent workflow, or SDD on a brownfield repo. Do NOT use for one-off bug fixes, generic code review, CI-only setup without agent methodology, or infrastructure deploys unrelated to agent workflow.
license: MIT
compatibility: Requires Node.js 18+ and git. Optional gh CLI and Atlassian MCP for integrations.
metadata:
  author: JoaoLuiz92
  version: "1.3.0"
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
| `docs/workflow/bootstrap/profile.md` (+ `profile.json`) | 1a |
| `docs/workflow/bootstrap/codebase/*.md` (8 files) | 1a + 1b |
| `docs/workflow/bootstrap/context.md` | 2 |
| `docs/workflow/bootstrap/gap-report.md` | 3 |
| `docs/workflow/bootstrap/harness-plan.md` | 4 |
| `docs/workflow/bootstrap/tasks.md` | 4 |

In `plan` mode, write the same content to `.tmp-harness-*.md` at repo root instead (codebase map → `.tmp-harness-codebase/`).

**Gate:** if any Part A file is missing, complete that phase — do not show Q5 or start Part B. Codebase gate: all 8 files in `docs/workflow/bootstrap/codebase/` and `DISCOVERY.md` shows gate **passed** (≥80% of **applicable** checklist items, or harness-only repo with harness sections populated).

### Phase 1a: Scan (read-only, automatic)

Run the bundled scanner and codebase mapper against the **target repo**:

```bash
node "$SKILL_ROOT/scripts/scan-profile.mjs" --cwd <target-repo> --json --out docs/workflow/bootstrap/profile.json
node "$SKILL_ROOT/scripts/scan-profile.mjs" --cwd <target-repo> --out docs/workflow/bootstrap/profile.md
node "$SKILL_ROOT/scripts/map-codebase.mjs" --cwd <target-repo> --profile docs/workflow/bootstrap/profile.json \
  --out docs/workflow/bootstrap/codebase/
```

In `plan` mode when `docs/` must not exist yet: write profile to `.tmp-harness-profile.md` / `.tmp-harness-profile.json` and codebase to `.tmp-harness-codebase/`.

Also read target README, package manifests, CI workflows, and any `AGENTS.md` / `CLAUDE.md`.

**Validation:** `profile.md` exists; 8 scaffolded docs exist under `bootstrap/codebase/`.

**On failure:** fix Node path or `--cwd`; re-run scan. Do not proceed without profile + scaffolds.

### Phase 1b: Brownfield enrichment (recommended)

The scan (1a) already produces **deep, code-derived** content in all 8 docs. Phase 1b is for **gaps the scanner cannot infer** — team conventions, prod hosting, critical business flows, secret scope.

Follow [references/codebase-mapping-protocol.md](references/codebase-mapping-protocol.md) and [references/discovery-checklist.md](references/discovery-checklist.md).

- Read README, CI, and any modules the scan flagged as partial
- Fill optional `<!-- AGENT:complete -->` sections (do not invent; use `_Unknown_` if not found)
- Add org-specific concerns to `CONCERNS.md` **without fixing code**
- Cross-check `DISCOVERY.md` checklist; mark any items the scan missed

**Validation:** 8 files exist; deep scan sections populated; agent sections filled or explicitly `_Unknown_`; `DISCOVERY.md` gate **passed** (applicable checklist ≥80%, or harness-only with validation-lane sections complete).

**On failure:** complete missing reads before Phase 2.

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
| bootstrap `codebase/` (if exists) | **copied** to `.specs/codebase/` (8 docs) |
| else `map-codebase.mjs` fallback | `.specs/codebase/*.md` (scaffold + enrichment banner) |
| install config | `.specs/project/` (PROJECT, STATE, ROADMAP, DEPLOY-PLAN, context) |
| templates | `.specs/README.md`, `features/` (+ `delivery.md.tpl`), `quick/` (CURRENT-FOCUS, NEXT-ACTIONS), `testing/strategy.md` |

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
- [ ] `.specs/codebase/DISCOVERY.md` exists (8-doc map)
- [ ] `.specs/project/PROJECT.md` + `.specs/quick/CURRENT-FOCUS.md` exist
- [ ] Tool adapters installed for each entry in `TOOLS`
- [ ] Root `package.json` exists with `validation-lane:*` and `specs:refresh` scripts (create minimal root `package.json` if the repo has none — e.g. .NET-only monorepos)
- [ ] `npm run validation-lane:handoff -- --name smoke` succeeds (or document `node scripts/validation-lane.mjs` if npm unavailable)

Tell the user in plain language what was created and where to start (`AGENTS.md`, `.specs/quick/CURRENT-FOCUS.md`, `docs/workflow/README.md`).

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
| [references/discovery-checklist.md](references/discovery-checklist.md) | Phase 1b enrichment |
| [references/codebase-mapping-protocol.md](references/codebase-mapping-protocol.md) | Phase 1b detailed steps |
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
