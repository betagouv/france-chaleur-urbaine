## Database Migrations

**Tool**: Knex migrations + Kysely for types  
**Location**: `src/server/db/migrations/`  
**Format**: `YYYYMMDDHHMMSS_description.ts`

## Commands

```bash
pnpm db:migrate                      # Run pending migrations
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
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS table_name (
      id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
      name TEXT NOT NULL,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      data jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_table_user_id ON table_name (user_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS table_name CASCADE;`);
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

- **Raw SQL preferred**: Use `knex.raw()` for explicit control
- **One-way migrations**: Implement `up`, leave `down` empty or minimal
- **Always index**: Foreign keys, JSONB extracts, spatial columns
- **JSONB**: Use targeted indexes (extract fields) over global GIN
- **PostGIS**: Store in Lambert 93 (SRID 2154), not WGS84
- **Run `pnpm db:sync`** after EVERY migration to update Kysely types
