import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('network_iris');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('network_iris', (table) => {
    table.integer('fid').primary();
    table.specificType('geom', 'geometry(MultiPolygon,2154)');
    table.string('code_iris', 9);
  });
}
