# Stack — brownfield-repo

<!-- auto:summary -->
**Scanned:** 2026-06-20T22:28:21.015Z
**Languages:** javascript/typescript
**Package managers:** npm
**Layout:** monorepo (3 packages)
<!-- /auto -->

## Package roles

<!-- auto:roles -->
| Path | Name | Role | Frameworks |
|------|------|------|------------|
| `root` | brownfield-fixture | package | — |
| `backend` | brownfield-backend | backend API | @nestjs/core |
| `frontend` | brownfield-frontend | frontend UI | react, react-dom, react-router-dom, vite, vitest, @vitejs/plugin-react |
<!-- /auto -->

## Runtime and tooling

<!-- auto:packages -->
| Package | Name | Scripts | Key versions |
|---------|------|---------|-------------|
| `root` | brownfield-fixture | test, lint, build | — |
| `backend` | brownfield-backend | dev, test, lint, build | @nestjs/core@^10.0.0 |
| `frontend` | brownfield-frontend | dev, test, lint, build | react@^18.2.0, react-dom@^18.2.0, react-router-dom@^6.0.0, vite@^5.0.0, vitest@^1.0.0, @vitejs/plugin-react@^4.0.0 |
<!-- /auto -->

## Dev / test / build commands

<!-- auto:commands -->
| Kind | Package | Command |
|------|---------|--------|
| test | `root` | `npm test` |
| lint | `root` | `npm run lint` |
| build | `root` | `npm run build` |
| dev | `backend` | `cd backend && npm run node src/main.js` |
| test | `backend` | `cd backend && npm test` |
| lint | `backend` | `cd backend && npm run lint` |
| build | `backend` | `cd backend && npm run build` |
| dev | `frontend` | `cd frontend && npm run vite` |
| test | `frontend` | `cd frontend && npm test` |
| lint | `frontend` | `cd frontend && npm run lint` |
| build | `frontend` | `cd frontend && npm run build` |
<!-- /auto -->

## Test frameworks

<!-- auto:frameworks -->
- jest
- vitest
<!-- /auto -->

## CI/CD

<!-- auto:ci -->
### `.github/workflows/ci.yml`
- Triggers: push, pull_request
- Jobs: on, push, pull_request, lint, test, build
- Blocking: yes

| Workflow | Job | Steps |
|----------|-----|-------|
| `.github/workflows/ci.yml` | on | test, lint, build |
| `.github/workflows/ci.yml` | push | test, lint, build |
| `.github/workflows/ci.yml` | pull_request | test, lint, build |
| `.github/workflows/ci.yml` | lint | test, lint, build |
| `.github/workflows/ci.yml` | test | test, build |
| `.github/workflows/ci.yml` | build | build |
<!-- /auto -->

## Docker

<!-- auto:docker -->
- **Dockerfile:** `Dockerfile`
<!-- /auto -->

## Production notes

<!-- AGENT:complete -->
_Optional: document deploy targets, prod Node/runtime versions, or hosting (Vercel, AWS, etc.) not visible in repo._
<!-- /AGENT -->
