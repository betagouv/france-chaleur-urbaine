import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    alter table pro_eligibility_tests add column deleted_at timestamptz;
  `);
}

export async function down() {}
