import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ces champs seront mis à jour dès qu'une géométrie est mise à jour.
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur ADD COLUMN date_actualisation_trace timestamptz;
    ALTER TABLE public.reseaux_de_froid ADD COLUMN date_actualisation_trace timestamptz;
    ALTER TABLE public.zone_de_developpement_prioritaire ADD COLUMN date_actualisation_trace timestamptz;
    ALTER TABLE public.zones_et_reseaux_en_construction ADD COLUMN date_actualisation_trace timestamptz;

    ALTER TABLE public.reseaux_de_chaleur ADD COLUMN date_actualisation_pdp timestamptz;
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
