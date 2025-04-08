import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur ADD COLUMN communes_insee text[];
    ALTER TABLE public.reseaux_de_froid ADD COLUMN communes_insee text[];
    ALTER TABLE public.zone_de_developpement_prioritaire ADD COLUMN communes_insee text[];
    ALTER TABLE public.zones_et_reseaux_en_construction ADD COLUMN communes_insee text[];
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
