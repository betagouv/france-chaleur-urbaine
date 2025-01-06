import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE pro_eligibility_tests_addresses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sourceAddress TEXT NOT NULL,
      banAddress TEXT NOT NULL,
      banScore DOUBLE PRECISION NOT NULL,
      geom geometry(MultiPolygon,2154) NOT NULL,
      eligible BOOLEAN NOT NULL,
      -- TODO intégrer toutes les infos (id réseau, distance, etc)
      test_id UUID NOT NULL REFERENCES pro_eligibility_tests (id)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
