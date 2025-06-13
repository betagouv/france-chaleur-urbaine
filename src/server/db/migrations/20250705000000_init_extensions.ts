import { type Knex } from 'knex';

// This creates an index on the nom column of the ign_communes table.
// - It applies the unaccent function to remove accents before indexing.
// - It uses a GIN index with trigram operations (gin_trgm_ops), which improves search performance for text queries, especially LIKE, ILIKE, and full-text searches.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- obligatoire pour utiliser unaccent dans un index
    CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$
      SELECT public.unaccent($1::text);
    $$ LANGUAGE sql IMMUTABLE;
  `);
}

export async function down() {}
