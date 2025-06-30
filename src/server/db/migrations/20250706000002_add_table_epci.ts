import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('epci');
  await knex.schema.createTable('epci', (table) => {
    table.string('code').primary();
    table.string('nom').notNullable();
    table.string('type').notNullable();
    table.jsonb('membres').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('epci');
}
