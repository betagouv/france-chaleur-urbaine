import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Make pro_eligibility_tests_addresses.eligibility_history nullable
    ALTER TABLE public.pro_eligibility_tests_addresses
      ALTER COLUMN eligibility_history DROP NOT NULL,
      ALTER COLUMN eligibility_history DROP DEFAULT;

    UPDATE public.pro_eligibility_tests_addresses
      SET eligibility_history = NULL
      WHERE eligibility_history = '[]'::jsonb and ban_valid is false;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Restore default value first for new rows
    ALTER TABLE public.pro_eligibility_tests_addresses
      ALTER COLUMN eligibility_history SET DEFAULT '[]'::jsonb;

    -- Ensure no NULLs remain before restoring NOT NULL
    UPDATE public.pro_eligibility_tests_addresses
      SET eligibility_history = '[]'::jsonb
      WHERE eligibility_history IS NULL;

    -- Restore NOT NULL constraint on eligibility_history
    ALTER TABLE public.pro_eligibility_tests_addresses
      ALTER COLUMN eligibility_history SET NOT NULL;
  `);
}
