## Database (Kysely + Postgres/PostGIS)

- Import: `import { kdb, sql } from '@/server/db/kysely'`
- Always use Kysely for type safety
- Models/types are generated; see `src/server/db/kysely/database.ts`
- Migrations via `pnpm db:migrate`; sync types with `pnpm db:sync`

Query guidelines:
- Select only required columns
- Use `sql` helper for PostGIS/advanced expressions
- Ensure indexes on filtered/joined columns
- Paginate lists (limit/offset or cursors)


