# Structure — brownfield-repo

<!-- auto:summary -->
**Layout:** monorepo
**Packages:** 3
<!-- /auto -->

## Annotated directory tree

<!-- auto:tree -->
- `.github/`
- `.github/workflows/`
  - `.github/workflows/ci.yml`
- `backend/` — Backend package
- `backend/src/` — Application source
- `backend/src/auth/`
- `backend/src/users/` — NestJS module folder
  - `backend/package.json`
  - `backend/README.md`
- `docs/` — Documentation
- `docs/sample-codebase-map/`
  - `docs/sample-codebase-map/ARCHITECTURE.md`
  - `docs/sample-codebase-map/CONCERNS.md`
  - `docs/sample-codebase-map/CONVENTIONS.md`
  - `docs/sample-codebase-map/DISCOVERY.md`
  - `docs/sample-codebase-map/INTEGRATIONS.md`
  - `docs/sample-codebase-map/STACK.md`
  - `docs/sample-codebase-map/STRUCTURE.md`
  - `docs/sample-codebase-map/TESTING.md`
- `frontend/` — Frontend package
- `frontend/src/` — Application source
- `frontend/src/pages/` — Page routes / views
  - `frontend/package.json`
  - `package.json`
  - `README.md`
<!-- /auto -->

## Package roles

<!-- auto:roles -->
| Path | Name | Role | Frameworks |
|------|------|------|------------|
| `root` | brownfield-fixture | package | — |
| `backend` | brownfield-backend | backend API | @nestjs/core |
| `frontend` | brownfield-frontend | frontend UI | react, react-dom, react-router-dom, vite, vitest, @vitejs/plugin-react |
<!-- /auto -->

## Migrations / schema

<!-- auto:migrations -->
_None detected._
<!-- /auto -->

## Folder notes

<!-- AGENT:complete -->
_Optional: clarify non-obvious folders or historical paths not inferrable from tree._
<!-- /AGENT -->
