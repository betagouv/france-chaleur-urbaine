import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    alter table zones_et_reseaux_en_construction alter column geom type geometry using geom::geometry(geometry, 2154);
  `);
}

export async function down() {}
