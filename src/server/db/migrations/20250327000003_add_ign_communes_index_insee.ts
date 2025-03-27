import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS ign_communes_insee_com_idx ON public.ign_communes USING gin(insee_com gin_trgm_ops);
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
