import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.reseaux_de_chaleur ALTER COLUMN website_gestionnaire TYPE varchar(254);
    UPDATE public.reseaux_de_chaleur SET website_gestionnaire = trim(website_gestionnaire);
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
