import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('eligibility_tests', (table) => {
    table.dropColumn('progress');
    table.dropColumn('email');
  });

  await knex.schema.createTable('eligibility_demands', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('eligibility_test_id')
      .notNullable()
      .references('id')
      .inTable('eligibility_tests');
    table.string('email', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('eligibility_demands');
  return knex.schema.table('eligibility_tests', (table) => {
    table.integer('progress');
    table.string('email', 255).notNullable();
  });
}
