# Sample codebase map (8 docs)

Frozen output of `map-codebase.mjs` for the [`tests/fixtures/brownfield-repo/`](../tests/fixtures/brownfield-repo/) fixture (mini monorepo: Nest-style backend + React frontend + CI + Docker + env examples).

Use this folder to see what a **deep brownfield map** looks like after Phase 1a bootstrap.

## Regenerate

From the repository root:

```bash
node skills/ab-harness-skill/scripts/scan-profile.mjs \
  --cwd tests/fixtures/brownfield-repo \
  --json \
  --out docs/sample-codebase-map/.profile.json

node skills/ab-harness-skill/scripts/map-codebase.mjs \
  --cwd tests/fixtures/brownfield-repo \
  --profile docs/sample-codebase-map/.profile.json \
  --out docs/sample-codebase-map/
```

`.profile.json` is gitignored; the eight `.md` files are committed as the reference snapshot.

## Layout

| File | Purpose |
|------|---------|
| [DISCOVERY.md](DISCOVERY.md) | Index + applicable checklist gate |
| [STACK.md](STACK.md) | Tooling, scripts, CI, Docker |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, modules, routes, data flow |
| [STRUCTURE.md](STRUCTURE.md) | Annotated directory tree |
| [CONVENTIONS.md](CONVENTIONS.md) | Naming, auth, API patterns |
| [TESTING.md](TESTING.md) | Test inventory and commands |
| [INTEGRATIONS.md](INTEGRATIONS.md) | External deps and env keys |
| [CONCERNS.md](CONCERNS.md) | Risks (record only) |

After user approval in Part A, Part B copies `docs/workflow/bootstrap/codebase/` → `.specs/codebase/` in the target repo.
