## Architecture (Essentials)

Align with `ARCHITECTURE.md` (hybrid: modules + legacy). Prefer modules and strict client/server separation.

- Stack: Next.js 15 (Pages Router), TypeScript strict
- Modules: `src/modules/*` with standard shape (client/, server/, types.ts)
- Legacy to migrate: `src/pages/api/`, `src/server/services/`, `src/services/`
- Module-internal imports: relative paths only (`./`, `../`)
- Shared types in `types.ts` at module root
- Never import server code from client code

Data flow:
- Client → legacy `/api` or module TRPC routers
- DB: PostgreSQL + PostGIS via Kysely (`import { kdb, sql } from '@/server/db/kysely'`)

Edit rules (always):
1) Read `ARCHITECTURE.md` and the module's `CLAUDE.md`
2) Follow patterns of 2–3 similar files
3) Prefer TRPC + Kysely over legacy services
4) Keep temporary re-exports for backward compatibility during migrations


