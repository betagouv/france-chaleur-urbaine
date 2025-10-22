import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS registre_copro_r11_220125;
  `);
}

export async function down() {}
