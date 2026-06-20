# Testing — brownfield-repo

<!-- auto:summary -->
**Frameworks:** - jest
- vitest
**Test files found:** 2
<!-- /auto -->

## Commands

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

## Test file inventory

<!-- auto:inventory -->
- `backend/src/users/users.spec.js`
- `frontend/src/pages/Home.test.tsx`
<!-- /auto -->

## Helpers, mocks, fixtures

<!-- auto:helpers -->
**Patterns:** *.spec.* (Jest/Nest style), *.test.* (Vitest/Jest style)
<!-- /auto -->

## Config files

<!-- auto:configs -->
_None._
<!-- /auto -->

## CI test jobs

<!-- auto:ci-tests -->
- `.github/workflows/ci.yml` / **on**
- `.github/workflows/ci.yml` / **push**
- `.github/workflows/ci.yml` / **pull_request**
- `.github/workflows/ci.yml` / **lint**
- `.github/workflows/ci.yml` / **test**
<!-- /auto -->

## Validation lane (harness)

<!-- auto:lane -->
_Not a harness repo._
<!-- /auto -->

## Examples and patterns

<!-- AGENT:complete -->
_Optional: point to canonical test files new contributors should copy._
<!-- /AGENT -->
