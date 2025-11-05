import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS demands (
      id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
      airtable_legacy_values jsonb NOT NULL
    );

    -- Unique index on the id field within airtable_legacy_values for fast lookups
    CREATE UNIQUE INDEX IF NOT EXISTS idx_demands_airtable_id ON demands ((airtable_legacy_values->>'id'));

    -- GIN index on airtable_legacy_values for efficient JSONB queries
    CREATE INDEX IF NOT EXISTS idx_demands_airtable_legacy_values ON demands USING gin (airtable_legacy_values);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS demands CASCADE;
  `);
}
