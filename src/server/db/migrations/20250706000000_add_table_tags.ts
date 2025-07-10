import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.createTable('tags', (table) => {
    table.string('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE UNIQUE INDEX tags_name_unicity ON tags(immutable_unaccent(lower(trim(name))))');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tags');
}
