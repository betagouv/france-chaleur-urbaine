import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.dropColumn('gestionnaire');
  });
  await knex.raw('ALTER TABLE users ADD COLUMN gestionnaires varchar(255)[];');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', (table) => {
    table.dropColumn('gestionnaires');
    table.string('gestionnaire', 255).notNullable();
  });
}
