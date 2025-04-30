import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE reseaux_de_chaleur
    DROP COLUMN IF EXISTS contenu_CO2_2023_tmp,
    DROP COLUMN IF EXISTS contenu_CO2_ACV_2023_tmp,
    ADD COLUMN IF NOT EXISTS "Moyenne-annee-DPE" varchar(255);
  `);
  await knex.raw(`
    ALTER TABLE reseaux_de_froid
    DROP COLUMN IF EXISTS contenu_CO2_2023_tmp,
    DROP COLUMN IF EXISTS contenu_CO2_ACV_2023_tmp,
    ADD COLUMN IF NOT EXISTS "Moyenne-annee-DPE" varchar(255);
  `);
}

export async function down(): Promise<void> {}
