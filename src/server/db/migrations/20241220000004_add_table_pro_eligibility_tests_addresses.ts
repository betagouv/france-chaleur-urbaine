import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE pro_eligibility_tests_addresses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_address TEXT NOT NULL,
      ban_address TEXT NOT NULL,
      ban_score integer NOT NULL,
      geom geometry(Point,2154) NOT NULL,
      eligibility_status JSONB NOT NULL,
      test_id UUID NOT NULL REFERENCES pro_eligibility_tests (id)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
