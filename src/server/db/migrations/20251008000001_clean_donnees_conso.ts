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
  `);
}

export async function down() {}
