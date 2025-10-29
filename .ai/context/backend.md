## Backend (API & TRPC)

- Use legacy `/api` routes only when necessary; prefer TRPC routers in modules
- Error handling: concise, actionable messages; no swallowed exceptions
- Logging: contextual, minimal, no sensitive data
- Logging: use winston logger as `@/server/helpers/logger`

Separation:
- `server/` (Node, DB, services) vs `client/` (React)
- Keep business logic out of `src/pages/api/*`; delegate to module services

Testing:
- Add vitest unit tests for critical services, utility functions and APIs
