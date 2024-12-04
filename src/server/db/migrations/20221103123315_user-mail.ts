import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('users', (table) => {
    table.boolean('receive_new_demands');
    table.boolean('receive_old_demands');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('users', (table) => {
    table.dropColumn('receive_new_demands');
    table.dropColumn('receive_old_demands');
  });
}
