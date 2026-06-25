import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Fusion des statuts de demande (legacy_values->>'Status').
 *
 * Nouveau jeu de statuts : "À traiter", "Non réalisable", "Recontacté pour étude",
 * "Proposition commerciale envoyée", "Voté en AG", "Travaux en cours", "Réalisé",
 * "Projet abandonné par le prospect".
 *
 * Correspondances appliquées (sur les demandes non supprimées) :
 *   - Status absent (null) ................................... → "À traiter"   (null = à traiter)
 *   - "En attente de prise en charge" ....................... → "À traiter"
 *   - "Étude en cours" + "En attente d'éléments du prospect"  → "Recontacté pour étude"
 *   - (null / "En attente de prise en charge") ET "Prise de contact" cochée → "Recontacté pour étude"
 *   - Les autres statuts sont inchangés.
 *
 * L'ordre est important : la règle "Prise de contact cochée" (étape 1) doit s'appliquer
 * AVANT la bascule générique vers "À traiter" (étape 2).
 *
 * Chaque changement de valeur émet un event `demand_updated_by_system` (author_id NULL =
 * système) au format générique `{ reason, changes: { <champ>: { from, to } } }` (ici le seul
 * champ modifié est `Status`) pour garder l'historique. Migration de données : pas de rollback (`down` no-op).
 *
 * Le champ legacy "Prise de contact" n'est pas purgé (lu ici) ; la case UI correspondante
 * ("Prospect recontacté") est supprimée côté code.
 *
 * Note : le statut "En attente d'éléments du prospect" est matché via `LIKE 'En attente
 * d_éléments du prospect'` (le `_` couvre l'apostrophe typographique) pour ne pas dépendre
 * de l'encodage exact de l'apostrophe dans ce fichier.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 1. "Prise de contact" cochée + statut à traiter (null ou "En attente de prise en charge") → "Recontacté pour étude"
  // Un Status null équivaut à "En attente de prise en charge" : on normalise le `from` de l'event en conséquence.
  await sql`
    INSERT INTO events (id, type, context_type, context_id, data, created_at)
    SELECT gen_random_uuid(), 'demand_updated_by_system', 'demand', id::text,
           jsonb_build_object('reason', 'fusion_statuts', 'changes',
             jsonb_build_object('Status', jsonb_build_object('from', COALESCE(legacy_values->'Status', '"En attente de prise en charge"'::jsonb), 'to', 'Recontacté pour étude'))),
           NOW()
    FROM demands
    WHERE deleted_at IS NULL
      AND (legacy_values->>'Status' IS NULL OR legacy_values->>'Status' = 'En attente de prise en charge')
      AND (legacy_values->>'Prise de contact')::boolean = true;
  `.execute(db);
  await sql`
    UPDATE demands
    SET legacy_values = jsonb_set(legacy_values, '{Status}', '"Recontacté pour étude"'::jsonb, true)
    WHERE deleted_at IS NULL
      AND (legacy_values->>'Status' IS NULL OR legacy_values->>'Status' = 'En attente de prise en charge')
      AND (legacy_values->>'Prise de contact')::boolean = true;
  `.execute(db);

  // 2. Reste des demandes à traiter (null ou "En attente de prise en charge") → "À traiter"
  await sql`
    INSERT INTO events (id, type, context_type, context_id, data, created_at)
    SELECT gen_random_uuid(), 'demand_updated_by_system', 'demand', id::text,
           jsonb_build_object('reason', 'fusion_statuts', 'changes',
             jsonb_build_object('Status', jsonb_build_object('from', COALESCE(legacy_values->'Status', '"En attente de prise en charge"'::jsonb), 'to', 'À traiter'))),
           NOW()
    FROM demands
    WHERE deleted_at IS NULL
      AND (legacy_values->>'Status' IS NULL OR legacy_values->>'Status' = 'En attente de prise en charge');
  `.execute(db);
  await sql`
    UPDATE demands
    SET legacy_values = jsonb_set(legacy_values, '{Status}', '"À traiter"'::jsonb, true)
    WHERE deleted_at IS NULL
      AND (legacy_values->>'Status' IS NULL OR legacy_values->>'Status' = 'En attente de prise en charge');
  `.execute(db);

  // 3. Fusion "Étude en cours" + "En attente d'éléments du prospect" → "Recontacté pour étude"
  await sql`
    INSERT INTO events (id, type, context_type, context_id, data, created_at)
    SELECT gen_random_uuid(), 'demand_updated_by_system', 'demand', id::text,
           jsonb_build_object('reason', 'fusion_statuts', 'changes',
             jsonb_build_object('Status', jsonb_build_object('from', legacy_values->'Status', 'to', 'Recontacté pour étude'))),
           NOW()
    FROM demands
    WHERE deleted_at IS NULL
      AND (legacy_values->>'Status' = 'Étude en cours' OR legacy_values->>'Status' LIKE 'En attente d_éléments du prospect');
  `.execute(db);
  await sql`
    UPDATE demands
    SET legacy_values = jsonb_set(legacy_values, '{Status}', '"Recontacté pour étude"'::jsonb, true)
    WHERE deleted_at IS NULL
      AND (legacy_values->>'Status' = 'Étude en cours' OR legacy_values->>'Status' LIKE 'En attente d_éléments du prospect');
  `.execute(db);
}

export async function down(): Promise<void> {
  // Migration de données : pas de rollback (no-op).
}
