import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    alter table zone_de_developpement_prioritaire alter column id_fcu type smallint;
  `);
}

export async function down() {}
