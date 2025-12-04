import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Remove check constraint to allow addresses to have both test_id and demand_id
    ALTER TABLE public.pro_eligibility_tests_addresses
      DROP CONSTRAINT IF EXISTS chk_test_or_demand_id;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Restore check constraint (only if data allows it)
    ALTER TABLE public.pro_eligibility_tests_addresses
      ADD CONSTRAINT chk_test_or_demand_id
      CHECK (
        (test_id IS NOT NULL AND demand_id IS NULL) OR
        (test_id IS NULL AND demand_id IS NOT NULL)
      );
  `);
}
