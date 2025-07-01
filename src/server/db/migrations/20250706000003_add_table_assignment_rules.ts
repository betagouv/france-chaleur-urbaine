import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('assignment_rules');
  await knex.schema.createTable('assignment_rules', (table) => {
    table.string('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('search_pattern').notNullable();
    table.string('result').notNullable();
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('assignment_rules');
}
