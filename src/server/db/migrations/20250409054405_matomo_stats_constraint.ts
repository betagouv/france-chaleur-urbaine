import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE matomo_stats ADD CONSTRAINT matomo_stats_unique UNIQUE (method, stat_key, date, stat_label, period);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE matomo_stats DROP CONSTRAINT matomo_stats_unique;
  `);
}
