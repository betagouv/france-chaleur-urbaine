import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Add comment columns to demands table
    ALTER TABLE public.demands
    ADD COLUMN comment_gestionnaire TEXT,
    ADD COLUMN comment_fcu TEXT;

    -- Migrate existing data from legacy_values JSONB to new columns
    UPDATE public.demands
    SET
      comment_gestionnaire = COALESCE(legacy_values->>'Commentaire', ''),
      comment_fcu = COALESCE(
        CONCAT_WS(E'\n',
          NULLIF(legacy_values->>'Commentaires_internes_FCU', ''),
          NULLIF(legacy_values->>'Commentaire FCU', '')
        ),
        ''
      );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Drop columns (data will be preserved in legacy_values)
    ALTER TABLE public.demands
      DROP COLUMN IF EXISTS comment_gestionnaire,
      DROP COLUMN IF EXISTS comment_fcu;
  `);
}
