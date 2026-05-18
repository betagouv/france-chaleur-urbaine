import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Backfill des anciens `demand_updated` vers des types dédiés selon la signature du `data`.
 * Le `data` est aussi transformé au nouveau format de chaque type cible.
 *
 * Events anonymes (author_id IS NULL) — flow user via lien :
 *   - {Recontacté par le gestionnaire}              → demand_satisfaction_submitted
 *   - {Commentaire relance}                         → demand_satisfaction_comment_submitted
 *   - {Sondage}                                     → demand_survey_submitted
 *
 * Events anonymes (author_id IS NULL) — actions système (cron) :
 *   - {Notification envoyé}                         → demand_notification_sent     (~8.7k)
 *   - {Relance ID, Relance envoyée}                 → demand_relance_sent (1ère)   (~900)
 *   - {Relance ID, Seconde relance envoyée}         → demand_relance_sent (2ème)   (~620)
 *
 * Pour les relances (1ère et 2ème), on supprime d'abord les `demand_updated` legacy
 * qui sont des doublons d'un `demand_relance_sent` déjà émis par le code actuel
 * (introduit le 2026-03-30) — sinon la migration créerait des doublons.
 *
 * Les `demand_updated` avec `author_id IS NOT NULL` (admin/gestionnaire) restent intacts.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // Dédup — supprime les `demand_updated` legacy doublons d'un `demand_relance_sent` déjà émis
  await sql`
    DELETE FROM events e
    WHERE e.type = 'demand_updated'
      AND e.context_type = 'demand'
      AND e.author_id IS NULL
      AND e.data ? 'Relance envoyée'
      AND NOT e.data ? 'Seconde relance envoyée'
      AND EXISTS (
        SELECT 1 FROM events drs
        WHERE drs.type = 'demand_relance_sent'
          AND drs.context_id = e.context_id
          AND (drs.data->>'isSecondRelance')::boolean = false
          AND ABS(EXTRACT(EPOCH FROM (drs.created_at - e.created_at))) < 3600
      );
  `.execute(db);

  await sql`
    DELETE FROM events e
    WHERE e.type = 'demand_updated'
      AND e.context_type = 'demand'
      AND e.author_id IS NULL
      AND e.data ? 'Seconde relance envoyée'
      AND EXISTS (
        SELECT 1 FROM events drs
        WHERE drs.type = 'demand_relance_sent'
          AND drs.context_id = e.context_id
          AND (drs.data->>'isSecondRelance')::boolean = true
          AND ABS(EXTRACT(EPOCH FROM (drs.created_at - e.created_at))) < 3600
      );
  `.execute(db);

  // Flow user — réponse satisfaction (Oui/Non)
  await sql`
    UPDATE events
    SET
      type = 'demand_satisfaction_submitted',
      data = jsonb_build_object(
        'recontacted', (data->>'Recontacté par le gestionnaire') = 'Oui'
      )
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND data ? 'Recontacté par le gestionnaire';
  `.execute(db);

  // Flow user — sondage post-soumission
  await sql`
    UPDATE events
    SET
      type = 'demand_survey_submitted',
      data = jsonb_build_object(
        'sondage', COALESCE(data->'Sondage', '[]'::jsonb)
      )
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND data ? 'Sondage';
  `.execute(db);

  // Flow user — commentaire post-satisfaction
  await sql`
    UPDATE events
    SET
      type = 'demand_satisfaction_comment_submitted',
      data = jsonb_build_object(
        'comment', data->>'Commentaire relance'
      )
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND data ? 'Commentaire relance';
  `.execute(db);

  // Système — notification gestionnaires (nouvelles demandes en attente)
  await sql`
    UPDATE events
    SET
      type = 'demand_notification_sent',
      data = '{}'::jsonb
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND data ? 'Notification envoyé';
  `.execute(db);

  // Système — 1ère relance demandeur
  await sql`
    UPDATE events
    SET
      type = 'demand_relance_sent',
      data = jsonb_build_object('isSecondRelance', false)
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND data ? 'Relance envoyée'
      AND NOT data ? 'Seconde relance envoyée';
  `.execute(db);

  // Système — 2ème relance demandeur
  await sql`
    UPDATE events
    SET
      type = 'demand_relance_sent',
      data = jsonb_build_object('isSecondRelance', true)
    WHERE type = 'demand_updated'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND data ? 'Seconde relance envoyée';
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE events
    SET
      type = 'demand_updated',
      data = jsonb_build_object(
        'Recontacté par le gestionnaire',
        CASE WHEN (data->>'recontacted')::boolean THEN 'Oui' ELSE 'Non' END
      )
    WHERE type = 'demand_satisfaction_submitted'
      AND context_type = 'demand';
  `.execute(db);

  await sql`
    UPDATE events
    SET
      type = 'demand_updated',
      data = jsonb_build_object('Commentaire relance', data->>'comment')
    WHERE type = 'demand_satisfaction_comment_submitted'
      AND context_type = 'demand';
  `.execute(db);

  await sql`
    UPDATE events
    SET
      type = 'demand_updated',
      data = jsonb_build_object('Sondage', data->'sondage')
    WHERE type = 'demand_survey_submitted'
      AND context_type = 'demand';
  `.execute(db);

  await sql`
    UPDATE events
    SET
      type = 'demand_updated',
      data = jsonb_build_object('Notification envoyé', NULL)
    WHERE type = 'demand_notification_sent'
      AND context_type = 'demand';
  `.execute(db);

  await sql`
    UPDATE events
    SET
      type = 'demand_updated',
      data = jsonb_build_object('Relance ID', NULL, 'Seconde relance envoyée', NULL)
    WHERE type = 'demand_relance_sent'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND (data->>'isSecondRelance')::boolean = true;
  `.execute(db);

  await sql`
    UPDATE events
    SET
      type = 'demand_updated',
      data = jsonb_build_object('Relance ID', NULL, 'Relance envoyée', NULL)
    WHERE type = 'demand_relance_sent'
      AND context_type = 'demand'
      AND author_id IS NULL
      AND (data->>'isSecondRelance')::boolean = false;
  `.execute(db);
}
