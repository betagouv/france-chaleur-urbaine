import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE jobs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL,
      data JSONB NOT NULL,
      result JSONB,
      status TEXT NOT NULL DEFAULT 'pending',
      entity_id UUID NOT NULL,
      user_id UUID NOT NULL REFERENCES users (id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
