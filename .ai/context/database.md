## Database

- Use PostgreSQL (16/18+) and PostGIS (3.5+) for SQL queries
- Always use Kysely (https://kysely.dev/llms.txt) for code for type safety, sometimes use raw sql if the query is complex
- Import: `import { kdb, sql } from '@/server/db/kysely'`
- Models/types are generated; see `src/server/db/kysely/database.ts`
- Migrations are in `src/server/db/migrations` (only up); they are run via `pnpm db:migrate`; sync types with `pnpm db:sync`

Query guidelines:
- Select only required columns
- Use `sql` helper for PostGIS/advanced expressions
- Ensure indexes on filtered/joined columns
- Paginate lists (limit/offset or cursors)
