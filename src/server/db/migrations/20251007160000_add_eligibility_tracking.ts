import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Add eligibility tracking columns to pro_eligibility_tests_addresses
    ALTER TABLE public.pro_eligibility_tests_addresses
      ADD COLUMN IF NOT EXISTS eligibility_history JSONB DEFAULT '[]'::jsonb NOT NULL;

    -- Add flag to pro_eligibility_tests to indicate if any address has changes
    ALTER TABLE public.pro_eligibility_tests
      ADD COLUMN IF NOT EXISTS has_unseen_changes BOOLEAN DEFAULT false NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_pro_eligibility_tests_has_unseen_changes
      ON public.pro_eligibility_tests(has_unseen_changes)
      WHERE has_unseen_changes = true;

    -- Add comment explaining the eligibility_history format
    COMMENT ON COLUMN public.pro_eligibility_tests_addresses.eligibility_history IS
      'JSON array storing full history of eligibility status changes. Format: [{"calculated_at": "ISO8601", "eligibility": {...getDetailedEligibilityStatus result...}}]';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Drop indexes
    DROP INDEX IF EXISTS public.idx_pro_eligibility_tests_has_unseen_changes;

    -- Remove columns from pro_eligibility_tests
    ALTER TABLE public.pro_eligibility_tests
      DROP COLUMN IF EXISTS has_unseen_changes;

    -- Remove columns from pro_eligibility_tests_addresses
    ALTER TABLE public.pro_eligibility_tests_addresses
      DROP COLUMN IF EXISTS eligibility_history;

    -- Restore old eligibility columns
    ALTER TABLE public.pro_eligibility_tests_addresses
      ADD COLUMN IF NOT EXISTS has_eligibility_change BOOLEAN DEFAULT false NOT NULL;
  `);
}
