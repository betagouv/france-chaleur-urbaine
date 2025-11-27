import type { Knex } from 'knex';

/**
 * Ajoute une colonne user_id à la table demands pour lier les demandes aux utilisateurs.
 *
 * Changements:
 * - Ajoute la colonne user_id (nullable) avec clé étrangère vers users
 * - ON DELETE SET NULL pour préserver les demandes si l'utilisateur est supprimé
 * - Crée un index sur user_id pour les performances de requête
 * - Crée un index btree sur l'email (LOWER(legacy_values->>'Mail')) pour les opérations de liaison
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Add user_id column as optional foreign key
    ALTER TABLE public.demands
    ADD COLUMN user_id UUID
    REFERENCES public.users(id)
    ON DELETE SET NULL;

    -- Create index for performance on user_id lookups
    CREATE INDEX idx_demands_user_id ON public.demands(user_id);

    -- Create btree index on email for linking operations (using expression index)
    CREATE INDEX idx_demands_email ON public.demands
    USING btree(LOWER(legacy_values->>'Mail'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Drop indexes
    DROP INDEX IF EXISTS public.idx_demands_email;
    DROP INDEX IF EXISTS public.idx_demands_user_id;

    -- Drop column (this will also drop the foreign key constraint)
    ALTER TABLE public.demands DROP COLUMN IF EXISTS user_id;
  `);
}
