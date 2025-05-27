import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pro_comparateur_configurations', (table) => {
    table.string('address');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('pro_comparateur_configurations');
}
