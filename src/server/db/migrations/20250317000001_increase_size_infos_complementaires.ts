import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    alter table reseaux_de_chaleur alter column "informationsComplementaires" type text;
    alter table reseaux_de_froid alter column "informationsComplementaires" type text;
  `);
}

export async function down() {}
