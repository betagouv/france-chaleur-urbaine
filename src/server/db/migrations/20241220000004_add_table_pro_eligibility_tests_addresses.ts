import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE pro_eligibility_tests_addresses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_address TEXT NOT NULL,
      ban_valid BOOLEAN NOT NULL,
      ban_address TEXT,
      ban_score integer,
      geom geometry(Point,2154),
      eligibility_status JSONB,
      test_id UUID NOT NULL REFERENCES pro_eligibility_tests (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_pro_eligibility_tests_addresses_test_id ON pro_eligibility_tests_addresses USING btree (test_id);
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
