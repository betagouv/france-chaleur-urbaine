import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE EXTENSION IF NOT EXISTS unaccent;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- obligatoire pour utiliser unaccent dans un index
    ALTER FUNCTION unaccent(text) IMMUTABLE;
    ALTER FUNCTION unaccent(regdictionary, text) IMMUTABLE;

    CREATE INDEX IF NOT EXISTS idx_ign_communes_unaccent ON ign_communes USING gin (unaccent(nom) gin_trgm_ops);
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
