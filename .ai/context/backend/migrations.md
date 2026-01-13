## Database Migrations

**Tool**: Kysely migrations
**Location**: `src/server/db/migrations/`
**Format**: `YYYYMMDDHHMMSS_description.ts`

## Commands

```bash
pnpm db:migrate                      # Run pending Kysely migrations
pnpm db:migrate:down                 # Roll back last migration
pnpm db:sync --single <table_name>   # Generate types for ONE table (stdout)
```

## Update Types After Migration

**DO NOT** run `pnpm db:sync` (overwrites entire `database.ts`)

**Instead**, generate types for the new/modified table:
```bash
pnpm db:sync --single demands
```

Then **manually merge** the output into `src/server/db/kysely/database.ts`:
- Copy new table interface
- Preserve existing custom types:
  - `Demands.legacy_values`: `JSONColumnType<AirtableLegacyRecord>` (not `JsonValue`)
  - `Events.type`: `EventType` (not `string`)
  - `Users.role`: `UserRole` (not `string`)
- Keep custom imports at top of file

## Migration Pattern

```typescript
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS table_name (
      id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
      name TEXT NOT NULL,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      data jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_table_user_id ON table_name (user_id);
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP TABLE IF EXISTS table_name CASCADE;
  `.execute(db);
}
```

## Patterns

### JSONB Indexes
```sql
-- Extract specific field
CREATE INDEX idx_demands_status ON demands ((legacy_values->>'Status'));

-- Partial index (conditional)
CREATE INDEX idx_demands_validated ON demands ((legacy_values->>'Gestionnaires validés'))
  WHERE legacy_values->>'Gestionnaires validés' = 'true';

-- GIN for array operations (?| operator)
CREATE INDEX idx_demands_gestionnaires ON demands USING gin ((legacy_values->'Gestionnaires'));
```

### PostGIS Geometry
```sql
-- Create geometry column (Lambert 93 / SRID 2154)
ALTER TABLE table_name ADD COLUMN geom geometry(MultiLineString, 2154);

-- Spatial index
CREATE INDEX idx_table_geom ON table_name USING gist (geom);

-- Fix invalid geometries
UPDATE table_name
SET geom = ST_CollectionExtract(ST_MakeValid(geom), 2)
WHERE NOT ST_IsValid(geom);
```

### Foreign Keys
```sql
-- With cascade delete
user_id uuid REFERENCES users(id) ON DELETE CASCADE
```

## Best Practices

- **Single SQL block**: Group all SQL statements in one `sql` template literal block
- **No column comments**: Do not add `COMMENT ON COLUMN` statements in migrations
- **Separate statements with semicolons**: Use semicolons to separate multiple SQL statements within the block
- **Use Kysely sql tag**: Use `sql` template literal for explicit control
- **One-way migrations**: Implement `up`, leave `down` empty or minimal
- **Always index**: Foreign keys, JSONB extracts, spatial columns
- **JSONB**: Use targeted indexes (extract fields) over global GIN
- **PostGIS**: Store in Lambert 93 (SRID 2154), not WGS84
- **Run `pnpm db:sync`** after EVERY migration to update Kysely types
- **Migration file naming**: Use timestamp format `YYYYMMDDHHMMSS_description.ts`