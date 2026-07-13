import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Nettoyage des espaces superflus sur `Mail` et `Adresse` dans `legacy_values` des demandes.
 *
 * La création trim désormais ces champs à l'écriture ; cette migration aligne les données historiques
 * pour que la déduplication (comparaison `lower(...)` sans `btrim`) fonctionne sur toute la base.
 *
 * On merge via `||` (et non `jsonb_set`, qui renvoie NULL — donc écraserait tout le `legacy_values` —
 * dès qu'un argument est NULL, ex. clé absente). Chaque clé n'est réécrite que si elle contient
 * bien une chaîne (`jsonb_typeof = 'string'`), sinon on merge `{}` : ni création de clé, ni perte d'un `null`.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE demands
    SET legacy_values = legacy_values
      || CASE WHEN jsonb_typeof(legacy_values->'Mail') = 'string'
              THEN jsonb_build_object('Mail', btrim(legacy_values->>'Mail')) ELSE '{}'::jsonb END
      || CASE WHEN jsonb_typeof(legacy_values->'Adresse') = 'string'
              THEN jsonb_build_object('Adresse', btrim(legacy_values->>'Adresse')) ELSE '{}'::jsonb END
    WHERE (jsonb_typeof(legacy_values->'Mail') = 'string' AND legacy_values->>'Mail' <> btrim(legacy_values->>'Mail'))
       OR (jsonb_typeof(legacy_values->'Adresse') = 'string' AND legacy_values->>'Adresse' <> btrim(legacy_values->>'Adresse'));
  `.execute(db);
}

export async function down(): Promise<void> {
  // Irréversible : le trim supprime les espaces d'origine, aucune information à restaurer.
}
