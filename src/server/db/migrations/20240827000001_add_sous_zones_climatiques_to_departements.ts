import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('departements', (table) => {
    table.string('sous_zones_climatiques');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('departements', (table) => {
    table.dropColumn('sous_zones_climatiques');
  });
}
