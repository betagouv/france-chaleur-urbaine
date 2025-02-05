import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE etudes_en_cours RENAME COLUMN description TO communes');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE etudes_en_cours RENAME COLUMN communes TO description');
}
