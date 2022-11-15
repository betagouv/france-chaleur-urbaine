import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('eligibility_tests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('hash').notNullable();
    table.integer('version').notNullable();
    table.string('email', 255).notNullable();
    table.integer('addresses_count');
    table.integer('progress');
    table.integer('error_count');
    table.integer('eligibile_count');
    table.text('result');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.boolean('in_error');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('eligibility_tests');
}
