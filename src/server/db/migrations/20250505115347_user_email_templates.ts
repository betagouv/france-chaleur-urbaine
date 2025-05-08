import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_templates');
  const tableExists = await knex.schema.hasTable('email_templates');
  if (tableExists) {
    return;
  }
  await knex.schema.createTable('email_templates', (table) => {
    table.string('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('subject').notNullable();
    table.text('body').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Add index on user_id for faster lookups
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_templates');
}
