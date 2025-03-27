import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.zone_de_developpement_prioritaire ADD COLUMN departement text;
    ALTER TABLE public.zones_et_reseaux_en_construction ADD COLUMN departement text;
    ALTER TABLE public.zone_de_developpement_prioritaire ADD COLUMN region text;
    ALTER TABLE public.zones_et_reseaux_en_construction ADD COLUMN region text;
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
