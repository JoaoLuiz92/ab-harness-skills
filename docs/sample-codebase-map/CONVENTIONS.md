# Conventions — brownfield-repo

## File naming (from codebase)

<!-- auto:naming -->
| Suffix | Count | Typical use |
|--------|-------|-------------|
| `.guard` | 1 | Auth guards |
| `.module` | 1 | Module boundary |
| `.spec` | 1 | Tests |
| `.test` | 1 | Tests |
| `.config` | 1 | Project convention |
<!-- /auto -->

## API patterns

<!-- auto:api -->
- **path-alias** `@` — `frontend/vite.config.ts`
<!-- /auto -->

## Path aliases

<!-- auto:aliases -->
- `@` → /src (`frontend/vite.config.ts`)
<!-- /auto -->

## Auth conventions

<!-- auto:auth -->
- Guard: JwtAuthGuard (`backend/src/auth/jwt-auth.guard.js`)
- NestJS guards (`backend/src/auth/jwt-auth.guard.js`)
<!-- /auto -->

## Team conventions

<!-- AGENT:complete -->
_Optional: PR rules, branch naming, API response contracts agreed by the team._
<!-- /AGENT -->
