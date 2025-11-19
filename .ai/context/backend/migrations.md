## Database Migrations

**Tool**: Knex migrations + Kysely for types

## Commands

```bash
pnpm db:migrate  # Run pending migrations
pnpm db:sync     # Regenerate Kysely types after schema changes
```

## Migration File Pattern

Location: `src/server/db/migrations/`
Format: `YYYYMMDDHHMMSS_description.ts`

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('table_name', (table) => {
    table.string('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
  
  // Or raw SQL for complex operations
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('table_name');
}
```

## Best Practices

- Migrations are **one-way** (up only, down rarely used)
- Always add indexes for foreign keys and filtered columns
- Use `gen_random_uuid()` for UUIDs
- Use `timestamp with time zone` for timestamps
- PostGIS: use `knex.raw()` for geometry columns
- After migration: **ALWAYS run `pnpm db:sync`** to update types
