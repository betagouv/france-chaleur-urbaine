import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name varchar(255);
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name varchar(255);
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS structure_name varchar(255) NULL;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS structure_type varchar(100) NULL;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS structure_other varchar(255) NULL;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone varchar(20);
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS accepted_cgu_at timestamp;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS optin_at timestamp;

    CREATE INDEX IF NOT EXISTS idx_users_first_name ON public.users(first_name);
    CREATE INDEX IF NOT EXISTS idx_users_last_name ON public.users(last_name);
    CREATE INDEX IF NOT EXISTS idx_users_structure ON public.users(structure_name);
    CREATE INDEX IF NOT EXISTS idx_users_optin_at ON public.users(optin_at);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_users_first_name;
    DROP INDEX IF EXISTS idx_users_last_name;
    DROP INDEX IF EXISTS idx_users_structure;
    DROP INDEX IF EXISTS idx_users_optin_at;

    ALTER TABLE public.users DROP COLUMN IF EXISTS first_name;
    ALTER TABLE public.users DROP COLUMN IF EXISTS last_name;
    ALTER TABLE public.users DROP COLUMN IF EXISTS structure_name;
    ALTER TABLE public.users DROP COLUMN IF EXISTS structure_type;
    ALTER TABLE public.users DROP COLUMN IF EXISTS structure_other;
    ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
    ALTER TABLE public.users DROP COLUMN IF EXISTS accepted_cgu_at;
    ALTER TABLE public.users DROP COLUMN IF EXISTS optin_at;
  `);
}
