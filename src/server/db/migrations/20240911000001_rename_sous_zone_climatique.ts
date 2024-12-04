import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // obsolète car présent dans départements
  await knex.schema.table('communes', (table) => {
    table.dropColumn('sous_zones_climatiques');
  });
  await knex.schema.table('departements', (table) => {
    table.renameColumn('sous_zones_climatiques', 'sous_zone_climatique');
  });
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
