import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS pro_eligibility_tests_addresses_tiles
    (
        x bigint NOT NULL,
        y bigint NOT NULL,
        z bigint NOT NULL,
        tile bytea NOT NULL
    );

    -- permet de corriger en prod
    ALTER TABLE pro_eligibility_tests_addresses_tiles ADD CONSTRAINT pro_eligibility_tests_addresses_tiles_pkey PRIMARY KEY (z, x, y);
  `);
}

export async function down() {}
