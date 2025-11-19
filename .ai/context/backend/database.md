## Database

- Use PostgreSQL (16/18+) and PostGIS (3.5+) for SQL queries
- Always use Kysely for type safety, sometimes use raw SQL if the query is complex
- Import: `import { kdb, sql } from '@/server/db/kysely'`
- Models/types are generated; see `src/server/db/kysely/database.ts`

## Query Patterns

**Kysely (type-safe ORM)**:
```typescript
// Type-safe query
const users = await kdb
  .selectFrom('users')
  .select(['id', 'email'])
  .where('active', '=', true)
  .execute();
```

**Raw SQL** (for complex queries or PostGIS functions):
```typescript
import { sql } from '@/server/db/kysely';

const result = await sql`
  SELECT ST_Distance(geom1, geom2) as distance
  FROM table_name
  WHERE id = ${id}
`;
```

## Query Guidelines

- Select only required columns (avoid `SELECT *`)
- Use `sql` helper for PostGIS/advanced expressions
- Ensure indexes on filtered/joined columns
- Paginate lists (limit/offset or cursors)

## Performance

- Monitor query performance
- Use PostGIS functions when needed for geospatial operations
- Cache frequently accessed data
- Optimize N+1 queries
