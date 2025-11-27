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

    -- Create conditional indexes for efficient searching (only non-empty comments)
    CREATE INDEX idx_demands_comment_gestionnaire
      ON public.demands(comment_gestionnaire)
      WHERE comment_gestionnaire IS NOT NULL AND comment_gestionnaire != '';

    CREATE INDEX idx_demands_comment_fcu
      ON public.demands(comment_fcu)
      WHERE comment_fcu IS NOT NULL AND comment_fcu != '';

    -- Add comments for documentation
    COMMENT ON COLUMN public.demands.comment_gestionnaire IS
      'Gestionnaire comments - extracted from legacy_values.Commentaire';

    COMMENT ON COLUMN public.demands.comment_fcu IS
      'FCU internal comments - concatenation of legacy_values.Commentaires_internes_FCU and Commentaire FCU';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Drop indexes
    DROP INDEX IF EXISTS public.idx_demands_comment_fcu;
    DROP INDEX IF EXISTS public.idx_demands_comment_gestionnaire;

    -- Drop columns (data will be preserved in legacy_values)
    ALTER TABLE public.demands
      DROP COLUMN IF EXISTS comment_gestionnaire,
      DROP COLUMN IF EXISTS comment_fcu;
  `);
}
