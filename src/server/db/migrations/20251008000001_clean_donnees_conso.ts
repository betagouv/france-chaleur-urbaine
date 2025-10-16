import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE donnees_de_consos
      DROP IF EXISTS rownum,
      DROP IF EXISTS nom_commun,
      ALTER COLUMN adresse SET NOT NULL,
      ALTER COLUMN code_grand SET NOT NULL,
      ALTER COLUMN conso_nb SET NOT NULL,
      ALTER COLUMN geom SET NOT NULL,
      ALTER COLUMN pdl_nb SET NOT NULL;

    DROP TABLE IF EXISTS "Donnees_de_conso_et_pdl_gaz_nat_2020";
    DROP TABLE IF EXISTS "Donnees_de_conso_et_pdl_gaz_nat_2020";
    DROP TABLE IF EXISTS "batiments_raccordes_rdc";
  `);
}

export async function down() {}
