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
1. **Scan** — read-only profile (`scan-profile.mjs`)
2. **Interview** — AskQuestion rounds (tools, integrations, branches)
3. **Gap analysis** — maturity scoring
4. **Plan** — phased rollout; **AskQuestion approval** before install
5. **Install** — templates → `workflow.config.md`, `.specs/`, `docs/workflow/`, adapters
6. **Pilot** — first delivery through validation lane

## Repository layout

```
ab-harness-skills/
├── skills/ab-harness-skill/   # Publishable skill (skills.sh)
│   ├── SKILL.md
│   ├── references/
│   ├── templates/
│   └── scripts/
├── tests/fixtures/minimal-repo/  # Smoke-test fixture
├── scripts/test-skill-package.mjs
└── docs/sample-harness-plan.md   # Example Phase 4 output
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
