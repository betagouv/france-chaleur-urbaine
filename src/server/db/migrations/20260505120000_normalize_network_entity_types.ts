import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Aligne les valeurs de type d'entité réseau sur la convention canonique
 * `reseau_de_chaleur` / `reseau_de_froid` / `reseau_en_construction` / `perimetre_de_developpement_prioritaire`.
 *
 * Concerne :
 * - `network_reminders.network_type` (`reseau_existant` → `reseau_de_chaleur`)
 * - `user_permissions.type` (`reseau_existant` → `reseau_de_chaleur`)
 * - `demands.network_type` (`existant` → `reseau_de_chaleur`, `en_construction` → `reseau_en_construction`)
 * - `demands.pending_assignment_change->>'network_type'` (idem)
 * - `events.context_type` : nettoyage des valeurs incohérentes introduites pendant le développement de la PR
 *   (`reseaux_en_construction` pluriel → `reseau_en_construction` singulier)
 * - `events.data->>'network_type'` pour les events `network_notes_updated` / `network_reminder_*`
 *   (`reseau_existant` → `reseau_de_chaleur`)
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE network_reminders SET network_type = 'reseau_de_chaleur' WHERE network_type = 'reseau_existant';

    UPDATE user_permissions SET type = 'reseau_de_chaleur' WHERE type = 'reseau_existant';

    UPDATE demands SET network_type = 'reseau_de_chaleur' WHERE network_type = 'existant';
    UPDATE demands SET network_type = 'reseau_en_construction' WHERE network_type = 'en_construction';

    UPDATE demands
      SET pending_assignment_change = jsonb_set(pending_assignment_change, '{network_type}', '"reseau_de_chaleur"')
      WHERE pending_assignment_change->>'network_type' = 'existant';
    UPDATE demands
      SET pending_assignment_change = jsonb_set(pending_assignment_change, '{network_type}', '"reseau_en_construction"')
      WHERE pending_assignment_change->>'network_type' = 'en_construction';

    UPDATE events SET context_type = 'reseau_en_construction' WHERE context_type = 'reseaux_en_construction';
    UPDATE events SET context_type = 'perimetre_de_developpement_prioritaire' WHERE context_type = 'pdp';

    UPDATE events
      SET data = jsonb_set(data, '{network_type}', '"reseau_de_chaleur"')
      WHERE data->>'network_type' = 'reseau_existant';
  `.execute(db);
}

export async function down(): Promise<void> {}
