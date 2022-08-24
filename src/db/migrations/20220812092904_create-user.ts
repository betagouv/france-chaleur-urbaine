import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable();
    table.string('password', 255).notNullable();
    table.string('gestionnaire', 255).notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_connection');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
