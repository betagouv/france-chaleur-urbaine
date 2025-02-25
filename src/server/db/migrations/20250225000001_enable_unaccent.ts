import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE EXTENSION unaccent;

    CREATE INDEX idx_ign_communes_unaccent ON ign_communes USING gin (unaccent(nom) gin_trgm_ops);
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
