import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reseaux_de_chaleur', (table) => {
    table.dropColumns('commentaires', 'date');
  });
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
