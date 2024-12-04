import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE INDEX IF NOT EXISTS donnees_de_consos_geom_idx ON public.donnees_de_consos USING gist(geom)`);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
