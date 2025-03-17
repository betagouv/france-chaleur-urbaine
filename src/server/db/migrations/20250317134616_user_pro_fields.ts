import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.users ADD COLUMN first_name varchar(255);
    ALTER TABLE public.users ADD COLUMN last_name varchar(255);
    ALTER TABLE public.users ADD COLUMN structure varchar(255);
    ALTER TABLE public.users ADD COLUMN structure_type varchar(100);
    ALTER TABLE public.users ADD COLUMN structure_other varchar(255);
    ALTER TABLE public.users ADD COLUMN job varchar(255);
    ALTER TABLE public.users ADD COLUMN phone varchar(20);
    ALTER TABLE public.users ADD COLUMN besoins varchar(255)[];
    ALTER TABLE public.users ADD COLUMN accepted_cgu_at timestamp;

    CREATE INDEX idx_users_first_name ON public.users(first_name);
    CREATE INDEX idx_users_last_name ON public.users(last_name);
    CREATE INDEX idx_users_structure ON public.users(structure);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_users_first_name;
    DROP INDEX IF EXISTS idx_users_last_name;
    DROP INDEX IF EXISTS idx_users_structure;

    ALTER TABLE public.users DROP COLUMN first_name;
    ALTER TABLE public.users DROP COLUMN last_name;
    ALTER TABLE public.users DROP COLUMN structure;
    ALTER TABLE public.users DROP COLUMN structure_type;
    ALTER TABLE public.users DROP COLUMN structure_other;
    ALTER TABLE public.users DROP COLUMN job;
    ALTER TABLE public.users DROP COLUMN phone;
    ALTER TABLE public.users DROP COLUMN besoins;
    ALTER TABLE public.users DROP COLUMN accepted_cgu_at;
  `);
}
