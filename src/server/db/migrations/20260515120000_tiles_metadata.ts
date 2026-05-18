import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Table de métadonnées des sources de tuiles vectorielles.
 * Une ligne par sourceId de `tileSourcesConfig` ; `last_modified_at` est mis à jour
 * explicitement via `markTilesUpdated(sourceId)` à chaque écriture (build tippecanoe,
 * rebuild mémoire `demands`, CLI `tiles bump`).
 *
 * Utilisée par l'API tuiles pour calculer ETag / Last-Modified et autoriser la
 * revalidation HTTP côté navigateur (cf. `.ai/plans/tiles-http-caching.md`).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE tiles_metadata (
      source_id text PRIMARY KEY,
      last_modified_at timestamptz NOT NULL DEFAULT now()
    );

    INSERT INTO tiles_metadata (source_id) VALUES
      ('batiments-raccordes-reseaux-chaleur-froid'),
      ('bdnb-batiments'),
      ('besoins-en-chaleur'),
      ('besoins-en-chaleur-industrie-communes'),
      ('communes-fort-potentiel-pour-creation-reseaux-chaleur'),
      ('consommations-gaz'),
      ('demands'),
      ('enrr-mobilisables'),
      ('enrr-mobilisables-friches'),
      ('enrr-mobilisables-parkings'),
      ('enrr-mobilisables-thalassothermie'),
      ('enrr-mobilisables-zones-geothermie-profonde'),
      ('etudes-en-cours'),
      ('installations-geothermie-profonde'),
      ('installations-geothermie-surface-echangeurs-fermes'),
      ('installations-geothermie-surface-echangeurs-ouverts'),
      ('ouvrages-geothermie-surface-echangeurs-fermes'),
      ('ouvrages-geothermie-surface-echangeurs-ouverts'),
      ('perimetres-de-developpement-prioritaire'),
      ('perimetres-geothermie-profonde'),
      ('quartiers-prioritaires-politique-ville-2015-anru'),
      ('quartiers-prioritaires-politique-ville-2024'),
      ('reseaux-de-chaleur'),
      ('reseaux-de-froid'),
      ('reseaux-en-construction'),
      ('ressources-geothermales-nappes'),
      ('tests-adresses'),
      ('zones-a-urbaniser'),
      ('zones-opportunite-fort-froid'),
      ('zones-opportunite-froid'),
      ('zones-potentiel-chaud'),
      ('zones-potentiel-fort-chaud');
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE tiles_metadata;`.execute(db);
}
