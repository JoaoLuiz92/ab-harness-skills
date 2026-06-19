# MCP Setup

Configure external integrations when flags are ON in [workflow.config.md](../../workflow.config.md).

Set `MCP_STATUS=READY` after verification.

---

## JIRA_TASKS (Atlassian)

### Cursor

1. Settings → MCP → Add Atlassian server (or project `.cursor/mcp.json`)
2. Authenticate per server docs
3. Verify: list issues for `TRACKER_PREFIX`

### Claude Code

1. Project or user MCP config
2. Same Atlassian MCP package as Cursor where compatible

### Codex

```toml
# ~/.codex/config.toml or .codex/config.toml
[mcp_servers.atlassian]
enabled = true
# command/args per your Atlassian MCP package documentation
```

---

## GITHUB_PULL_REQUESTS

### Terminal (all tools)

```bash
gh auth login
gh repo view
```

### MCP (optional)

- Cursor / Claude: GitHub MCP server
- Codex:

```toml
[mcp_servers.github]
enabled = true
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env_vars = ["GITHUB_PERSONAL_ACCESS_TOKEN"]
```

---

## CONFLUENCE

### All tools

Use Atlassian/Confluence MCP when available. Publish only non-secret content.

Space: `{{CONFLUENCE_SPACE}}`

---

## MCP_PENDING

If MCP is not ready:

1. Keep `MCP_STATUS=PENDING` in workflow.config.md
2. Use local fallbacks (next_actions, merge-checklist, repo docs)
3. Lane report may note `MCP_PENDING`

---

## Security

- Never commit tokens or API keys
- Use environment variables only
- Prefer read-only scopes for validation runners
