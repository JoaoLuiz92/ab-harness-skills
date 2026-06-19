# Codex CLI Adapter

## Entry points

| File | Role |
|------|------|
| `AGENTS.md` | Primary persistent instructions ([agents.md](https://agents.md/) standard) |
| `.codex/config.toml` | MCP servers (project or user) |

Verify loaded instructions:

```bash
codex --print-instructions
```

## AGENTS.md pattern

Include a **Workflow** section pointing to:

- `workflow.config.md`
- `docs/workflow/README.md`
- `docs/workflow/test-lane.md`

Keep total AGENTS.md within size budget (default 32 KiB combined chain). Link heavy docs.

## MCP

```toml
# .codex/config.toml.example (copy to ~/.codex or project .codex/)
[mcp_servers.github]
enabled = true
# ... see mcp-setup.md
```

Use `codex mcp list` to verify.

## Validation lane — `VALIDATION_CODEX=script-only`

Codex typically runs as single agent. Isolation via **script evidence**, not subagents:

```bash
npm run validation-lane:handoff -- --name <slug> ...
npm run validation-lane:runner -- --runner lint-build --name <slug>
npm run validation-lane:runner -- --runner unit --name <slug> --pattern <p>
npm run validation-lane:runner -- --runner integration --name <slug> --pattern <p>
npm run validation-lane:runner -- --runner e2e --name <slug>
npm run validation-lane:runner -- --runner uat --name <slug>
npm run validation-lane:merge -- --name <slug>
```

**Rule:** Implementer session should not skip merge or hand-write report.

## Multi-session variant

If user prefers: open fresh `codex` session per runner with readonly mindset — optional, same commands.

## Rules vs config

- Soft behavior: `AGENTS.md`
- Hard controls: `config.toml` (sandbox, approvals, MCP allowlist)

## PR workflow

When `GITHUB_PULL_REQUESTS=ON`: terminal `gh` works inside Codex sandbox if allowed.
