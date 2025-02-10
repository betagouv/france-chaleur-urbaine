import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
  alter table users add column roles text[];
  update users set roles = array[role];
  alter table users alter column roles set not null;
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
