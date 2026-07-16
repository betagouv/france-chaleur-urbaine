import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Simplifie la table etudes_en_cours au strict nécessaire pour la popup de la carte.
 *
 * `status` n'est plus affiché ni lu nulle part. `commune_ids` reste la source
 * structurée permettant de retrouver les géométries des communes (ign_communes).
 * `communes` et `maitre_ouvrage` passent en text : les études multi-communes dépassent
 * facilement 255 caractères et faisaient échouer l'insertion.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE etudes_en_cours
      DROP COLUMN status,
      ALTER COLUMN communes TYPE text,
      ALTER COLUMN maitre_ouvrage TYPE text;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE etudes_en_cours
      ADD COLUMN status character varying(255) NOT NULL DEFAULT '',
      ALTER COLUMN communes TYPE character varying(255),
      ALTER COLUMN maitre_ouvrage TYPE character varying(255);
  `.execute(db);
}
