# MCP Integration Matrix

Behavior per flag and tool. Read `workflow.config.md` at runtime.

## Summary table

| Flag | OFF | ON | MCP unavailable |
|------|-----|----|-----------------|
| `JIRA_TASKS` | `next_actions.md` + `features/*/tasks.md` | Create/comment/transition via Atlassian MCP | Fallback local + `MCP_PENDING` in report |
| `GITHUB_PULL_REQUESTS` | `merge-checklist.md` manual | `gh pr create` or GitHub MCP | Local checklist + note in report |
| `CONFLUENCE` | Repo `docs/` only | Publish team docs via Confluence MCP | Repo docs only + wiki TODO |

---

## JIRA_TASKS

### OFF

- Delivery ID = handoff `name` slug
- Tasks in `docs/workflow/next_actions.md`
- Feature specs in `docs/workflow/features/<name>/`
- No `--tracker` on handoff CLI

### ON

- Handoff: `--tracker PROJ-42`
- Close delivery: comment on card (summary, technical, verification, docs)
- Transition when workflow allows (e.g. → PR Review)
- Link validation lane report in comment

### MCP setup by tool

| Tool | Config location |
|------|-----------------|
| Cursor | User/project MCP settings; Atlassian server |
| Claude Code | Project MCP or Claude Desktop config |
| Codex | `~/.codex/config.toml` or `.codex/config.toml` |

See `templates/docs/workflow/mcp-setup.md.tpl` in target repo after install.

---

## GITHUB_PULL_REQUESTS

### OFF

- Commit + push to feature branch
- Complete `docs/workflow/merge-checklist.md`
- Attach lane report path in commit message or team channel

### ON

- `gh pr create` with body: summary, test plan, lane report link
- Wait for CI required checks
- Merge via `gh pr merge` when green (human approval policy)

### MCP / CLI

- Prefer `gh` when installed (works all tools via terminal)
- GitHub MCP optional for issue/PR automation

---

## CONFLUENCE

### OFF

- All documentation in repo: `README`, `docs/`
- Close delivery: state "docs updated in repo" or "no doc change needed"

### ON

- Repo: minimal operational docs (README, env example, short runbooks)
- Confluence: domains, long API refs, team processes
- Never paste secrets into wiki
- Agent publishes via MCP when change affects non-developers

### Checklist trigger (either mode)

Update docs when: API contract, routes, migrations, env, deploy, integrations change.

---

## MCP_PENDING workflow

When flag is ON but MCP not configured:

1. Set `MCP_STATUS=PENDING` in `workflow.config.md`
2. Use OFF fallback behavior
3. Lane report footer: `Integration MCP_PENDING — local fallback used`
4. Add task: complete `docs/workflow/mcp-setup.md`

When MCP verified:

1. Set `MCP_STATUS=READY`
2. Re-run pilot delivery with integration enabled

---

## Security

- No production secrets in MCP env committed to git
- Use env vars referenced in config examples only
- Read-only MCP scopes where possible for validation runners
