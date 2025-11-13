import type { Knex } from 'knex';

/**
 * Ajoute ON DELETE CASCADE aux contraintes de clé étrangère référençant users
 * pour supprimer automatiquement les données associées lors de la suppression d'un utilisateur.
 *
 * Tables modifiées:
 * - jobs.user_id
 * - pro_eligibility_tests.user_id
 * - events.author_id (change de ON DELETE SET NULL à ON DELETE CASCADE)
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
    
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;

    ALTER TABLE public.pro_eligibility_tests DROP CONSTRAINT IF EXISTS pro_eligibility_tests_user_id_fkey;
    
    ALTER TABLE public.pro_eligibility_tests
      ADD CONSTRAINT pro_eligibility_tests_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;

    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_author_id_fkey;
    ALTER TABLE public.events
      ADD CONSTRAINT events_author_id_fkey 
        FOREIGN KEY (author_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
  `);
}

export async function down() {}
