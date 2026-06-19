# Validation Lane (local reference)

Full methodology: isolated validation before merge.

## Principle

**Implementer does not formally validate.** Use fast loop during dev; use this lane for merge gate.

## Steps

### 0. Fast loop (during implementation)

```bash
# Replace with your focused test command from lane-commands.json
npm test -- {{PATTERN_EXAMPLE}}
```

### 1. Handoff

```bash
npm run validation-lane:handoff -- \
  --name <slug> \
  {{TRACKER_FLAG}} \
  --pattern <test-pattern> \
  --area <source-path>
```

`{{TRACKER_FLAG}}` = `--tracker PROJ-42` when JIRA_TASKS=ON, else omit.

### 2. Runners

**Cursor** (`VALIDATION_CURSOR=subagents`): dispatch 5 parallel readonly subagents, each:

```bash
npm run validation-lane:runner -- --runner <role> --name <slug> --pattern <p>
```

Roles: `lint-build`, `unit`, `integration`, `e2e`, `uat`

**Claude** (`multi-session`): new session per role with same command.

**Codex** (`script-only`): run all 5 sequentially in terminal.

### 3. Merge

```bash
npm run validation-lane:merge -- --name <slug> {{TRACKER_FLAG}}
```

### 4. Close delivery

- **JIRA ON**: comment on card + link report; transition if allowed
- **GitHub ON**: `gh pr create` with report link in body
- **Else**: [merge-checklist.md](merge-checklist.md)

## Anti-patterns

- Hand-written report without merge
- Implementer runs all runners as final gate without isolation
- Skipping merge

## Config

Commands: [lane-commands.json](lane-commands.json)

Flags: [workflow.config.md](../../workflow.config.md)
