# ab-harness-skills

[![skills.sh](https://img.shields.io/badge/skills.sh-ab--harness--skill-blue)](https://skills.sh)

Portable **agent development harness** for any codebase — spec-driven delivery, isolated validation lanes, merge gates, and optional integrations (Jira, GitHub, Confluence).

Supports **Cursor**, **Claude Code**, and **OpenAI Codex**. Stack-agnostic.

## Install

```bash
npx skills add JoaoLuiz92/ab-harness-skills --skill ab-harness-skill -a cursor -g --copy -y
```

In Agent chat: `/ab-harness-skill` or ask to *bootstrap workflow on this repo*.

Also discoverable on [skills.sh](https://skills.sh).

## What the skill does

Bootstrap on a **target repository** (language select first, then six phases):

0. **Language** — AskQuestion: English, Português, Español, or Other
1. **Scan (1a)** — deep read-only profile (`scan-profile.mjs` → `profile.json`) + **8 codebase docs** (`map-codebase.mjs` → `docs/workflow/bootstrap/codebase/`)
2. **Enrich (1b)** — optional agent refinement of `<!-- AGENT:complete -->` sections
3. **Interview** — AskQuestion rounds (tools, integrations, branches)
4. **Gap analysis** — maturity scoring
5. **Plan** — phased rollout; **AskQuestion approval** before install
6. **Install** — copies approved bootstrap map to `.specs/codebase/` + `workflow.config.md`, adapters, validation lane
7. **Pilot** — first delivery through validation lane

After install, refresh auto-generated sections without losing manual edits:

```bash
npm run specs:refresh
```

See a frozen example of the 8-doc map: [docs/sample-codebase-map/](docs/sample-codebase-map/).

## Repository layout

```
ab-harness-skills/
├── skills/ab-harness-skill/   # Publishable skill (skills.sh)
│   ├── SKILL.md
│   ├── references/
│   ├── templates/
│   └── scripts/
├── tests/fixtures/minimal-repo/     # Smoke-test fixture
├── tests/fixtures/brownfield-repo/  # 8-doc map smoke fixture
├── tests/fixtures/harness-only-repo/
├── scripts/test-skill-package.mjs
├── docs/sample-harness-plan.md      # Example Phase 4 output
└── docs/sample-codebase-map/        # Frozen 8-doc map from brownfield fixture
```

## Maintainer checks

```bash
npm run test:skill-package
npm run test:skill-install
```

## Prerequisites

- Node.js 18+
- Git (recommended on target repos)

## Credits

Methodology and workflow patterns adapted from **[Tech Leads Club (TLC)](https://techleads.club/)** [Agent Skills](https://agent-skills.techleads.club/) (e.g. `tlc-spec-driven`). See [skills/ab-harness-skill/CREDITS.md](skills/ab-harness-skill/CREDITS.md).

## License

MIT — see [LICENSE](LICENSE).
