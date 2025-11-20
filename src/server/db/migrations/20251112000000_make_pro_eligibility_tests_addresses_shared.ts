import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Make test_id nullable so addresses can link to either tests or demands
    ALTER TABLE public.pro_eligibility_tests_addresses
      ALTER COLUMN test_id DROP NOT NULL;

    -- Add demand_id column to link addresses to demands
    ALTER TABLE public.pro_eligibility_tests_addresses
      ADD COLUMN IF NOT EXISTS demand_id uuid REFERENCES public.demands(id) ON DELETE CASCADE;

    -- Create index on demand_id for performance
    CREATE INDEX IF NOT EXISTS idx_pro_eligibility_tests_addresses_demand_id
      ON public.pro_eligibility_tests_addresses (demand_id);

    -- Add check constraint to ensure exactly one of test_id or demand_id is set
    ALTER TABLE public.pro_eligibility_tests_addresses
      ADD CONSTRAINT chk_test_or_demand_id
      CHECK (
        (test_id IS NOT NULL AND demand_id IS NULL) OR
        (test_id IS NULL AND demand_id IS NOT NULL)
      );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Remove check constraint
    ALTER TABLE public.pro_eligibility_tests_addresses
      DROP CONSTRAINT IF EXISTS chk_test_or_demand_id;

    -- Drop demand_id index
    DROP INDEX IF EXISTS idx_pro_eligibility_tests_addresses_demand_id;

    -- Remove demand_id column
    ALTER TABLE public.pro_eligibility_tests_addresses
      DROP COLUMN IF EXISTS demand_id;

    -- Restore test_id as NOT NULL (this will fail if there are NULL values)
    -- First ensure all rows have a test_id before running the down migration
    ALTER TABLE public.pro_eligibility_tests_addresses
      ALTER COLUMN test_id SET NOT NULL;
  `);
}
