import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.users ADD COLUMN activation_token text;
    ALTER TABLE public.users ADD COLUMN activated_at TIMESTAMPTZ;
    ALTER TABLE public.users ADD COLUMN status text;
    UPDATE public.users SET status = 'valid';
    ALTER TABLE public.users ALTER COLUMN status SET NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {} // eslint-disable-line
