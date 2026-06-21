# ab-harness-skills

[![skills.sh](https://img.shields.io/badge/skills.sh-ab--harness--skill-blue)](https://skills.sh/JoaoLuiz92/ab-harness-skills/ab-harness-skill)
[![version](https://img.shields.io/badge/version-1.9.0-green)](skills/ab-harness-skill/CHANGELOG.md)

Portable **agent development harness** for any codebase — spec-driven delivery, isolated validation lanes, merge gates, and optional integrations (Jira, GitHub, Confluence).

Supports **Cursor**, **Claude Code**, and **OpenAI Codex**. Stack-agnostic (Node, Go, Django, .NET, Java/Spring, Python, Rust, and more).

---

## For users

### Install

Run from the **target repository** root. The CLI asks which agent you use (Cursor, Claude Code, Codex, etc.):

```bash
npx skills add JoaoLuiz92/ab-harness-skills@ab-harness-skill
```

Optional flags:

- `-y` — skip confirmation prompts
- `-a claude-code` / `-a cursor` / `-a codex` — target one agent without the picker
- `-g` — user-wide install instead of project scope (`.agents/skills/`)

Then in Agent chat: `/ab-harness-skill` or ask to *bootstrap workflow on this repo*.

Also on [skills.sh](https://skills.sh/JoaoLuiz92/ab-harness-skills/ab-harness-skill).

### What the skill does

Bootstrap on a **target repository** in three parts and six phases:

**Part A — Prepare (Phases 1–4):** read-only scan + interview + gap analysis + plan. No files are written to the target repo until you approve.

| Phase | Name | Deliverable |
|-------|------|-------------|
| 1a | Scan | `docs/workflow/bootstrap/profile.json` + 8 codebase docs |
| 1b | Enrich | Optional agent fill of `<!-- AGENT:complete -->` sections |
| 2 | Interview | AskQuestion rounds (tools, integrations, branches, UI flag) |
| 3 | Gap analysis | `docs/workflow/bootstrap/gap-report.md` (maturity scores 0–4 per pillar) |
| 4 | Plan | `docs/workflow/bootstrap/harness-plan.md` + `tasks.md`; **AskQuestion approval** before install |

**Part B — Install (Phase 5):** copies approved plan into `.specs/`, `workflow.config.md`, adapters, and validation lane.

**Part C — Pilot (Phase 6):** first delivery through the validation lane; calibrate `lane-commands.json` if runners fail.

After install, refresh auto-generated sections without losing manual edits:

```bash
npm run specs:refresh
```

### What you get

After install, your repo gains:

```
<repo>/
├── .specs/
│   ├── codebase/          # 8-doc codebase map (auto-generated)
│   ├── features/          # Per-feature spec, design, tasks, and delivery docs
│   ├── project/           # PROJECT.md, ROADMAP.md, STATE.md, DEPLOY-PLAN.md
│   ├── quick/             # Lightweight scratchpad docs for fast loops
│   └── testing/           # Strategy, gate checks, runner configs, UAT map
├── docs/workflow/
│   ├── lane-commands.json # Runner commands — calibrate for your stack ⚠️
│   ├── pilot-guide.md
│   └── ...
├── AGENTS.md              # Agent entry point (also CLAUDE.md / .codex/config.toml)
└── workflow.config.md     # Harness config (integrations, flags)
```

See [`examples/test-pilot-repo`](examples/test-pilot-repo) for a live reference.

> **Tip — calibrate `lane-commands.json` before first run.** After install, open `docs/workflow/lane-commands.json` and verify the `lint-build`, `unit`, `e2e`, and `uat` commands match your stack's actual commands. Auto-detection covers Node, Go, Django, .NET, Java/Spring, Python, Ruby, and PHP; other stacks get explicit `exit 1` placeholders that **must** be replaced before running the validation lane. Uncalibrated commands produce a false confidence signal.

### When NOT to use

The harness is **not** a good fit for:

- **One-off bug fixes or single-file changes** — overhead outweighs the benefit for changes you'll close in under an hour.
- **Pure infrastructure / ops work** — provisioning, secret rotation, or infra-as-code with no agent delivery loop.
- **Repos already using a conflicting agent methodology** — installing on top of an incompatible spec-driven system creates noise and duplication.
- **Throwaway scripts or prototypes** — if you plan to delete it, the harness scaffolding adds unnecessary complexity.
- **Teams not using Cursor, Claude Code, or Codex** — the validation lane and adapters are designed for these agents; manual or IDE-only workflows gain little benefit.

### Prerequisites

- Node.js 18+
- Git (recommended on target repos)

---

## For contributors

### Repository layout

```
ab-harness-skills/
├── skills/ab-harness-skill/        # Publishable skill (skills.sh)
│   ├── SKILL.md                    # Skill entry point + full instructions
│   ├── CHANGELOG.md
│   ├── references/                 # Methodology docs, checklists, adapters
│   ├── templates/                  # All .tpl files installed into target repos
│   └── scripts/                    # install-harness.mjs, scan-profile.mjs, etc.
├── examples/test-pilot-repo/       # Live post-install reference
├── tests/
│   ├── fixtures/minimal-repo/      # Smoke-test fixture (Node)
│   ├── fixtures/brownfield-repo/   # 8-doc map smoke fixture
│   ├── fixtures/harness-only-repo/ # Harness-only gate fixture
│   ├── fixtures/go-repo/
│   ├── fixtures/django-repo/
│   ├── fixtures/dotnet-repo/
│   └── fixtures/spring-repo/
├── scripts/
│   ├── test-skill-package.mjs      # Full test suite
│   └── regenerate-pilot-example.mjs
├── docs/sample-harness-plan.md     # Example Phase 4 output
└── docs/sample-codebase-map/       # Frozen 8-doc map from brownfield fixture
```

### Maintainer checks

```bash
# Run all smoke tests (layout + scan + install + validation lane + UAT + agents merge)
npm run test:skill-package

# Also test npx skills add end-to-end
npm run test:skill-install

# Refresh examples/test-pilot-repo from latest templates
npm run regenerate:pilot-example
```

### Adding a new template

1. Add file to `skills/ab-harness-skill/templates/`.
2. Register in `REQUIRED` array in `scripts/test-skill-package.mjs`.
3. If it needs to be installed into the target, wire it in `install-harness.mjs` or `generate-specs.mjs`.

### Version bump

1. Update `version` in `package.json`.
2. Update `metadata.version` in `skills/ab-harness-skill/SKILL.md` (must match — `checkLayout` asserts sync).
3. Add entry to `skills/ab-harness-skill/CHANGELOG.md`.
4. Add upgrade guide template `templates/docs/workflow/upgrade-vX.Y-to-vX.Z.md.tpl`.
5. Add new upgrade template to `REQUIRED` in `test-skill-package.mjs`.

### Credits

Methodology and workflow patterns adapted from **[Tech Leads Club (TLC)](https://techleads.club/)** [Agent Skills](https://agent-skills.techleads.club/) (e.g. `tlc-spec-driven`). See [skills/ab-harness-skill/CREDITS.md](skills/ab-harness-skill/CREDITS.md).

### License

MIT — see [LICENSE](LICENSE).
