import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { processGeometry } from '@/modules/geo/server/helpers';
import { AirtableDB } from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';

import { networkTableForId } from '../constants';
import { insertEntityWithGeometry, updateEntityGeometry } from './geometry-operations';

// Action réalisée (ou qui le serait en dry-run) pour un fichier.
type Action = 'created' | 'updated' | 'empty' | 'error';

// Tables réseau gérées par la commande (chaleur / froid).
type ReseauTable = NonNullable<ReturnType<typeof networkTableForId>>;

const airtableTableForReseau: Record<ReseauTable, Airtable> = {
  reseaux_de_chaleur: Airtable.NETWORKS,
  reseaux_de_froid: Airtable.COLD_NETWORKS,
};

export async function applyNetworkGeometries(directory: string, options: { dryRun: boolean }): Promise<void> {
  const { dryRun } = options;
  const entries = await readdir(directory);
  const files = entries.filter((f) => f.toLowerCase().endsWith('.geojson')).sort();

  if (files.length === 0) {
    logger.warn(`Aucun fichier .geojson trouvé dans ${directory}`);
    return;
  }

  const prefix = dryRun ? '[DRY-RUN] ' : '';
  logger.info(`${prefix}Application des géométries depuis ${files.length} fichiers GeoJSON`);

  const resolveAirtableIdFcu = createAirtableIdFcuResolver();

  // Sequential: each file does a SELECT + INSERT/UPDATE + label refresh; keeping it serial avoids
  // lock contention on the labels and gives predictable log ordering.
  const results: Action[] = [];
  for (const file of files) {
    const identifier = path.basename(file, path.extname(file));
    results.push(await applyOne(identifier, path.join(directory, file), dryRun, resolveAirtableIdFcu));
  }

  const counts = results.reduce<Record<Action, number>>((acc, s) => ({ ...acc, [s]: acc[s] + 1 }), {
    created: 0,
    empty: 0,
    error: 0,
    updated: 0,
  });

  logger.info(`${prefix}Résumé:`);
  if (counts.created > 0) logger.info(`  ${counts.created} ${dryRun ? 'seraient créés' : 'créés'}`);
  if (counts.updated > 0) logger.info(`  ${counts.updated} ${dryRun ? 'seraient mis à jour' : 'mis à jour'}`);
  if (counts.empty > 0) logger.warn(`  ${counts.empty} fichiers vides ignorés`);
  if (counts.error > 0) logger.error(`  ${counts.error} erreurs`);

  if (dryRun) {
    logger.info(`Aucune modification effectuée. Relancer avec --apply pour exécuter.`);
  }
}

async function applyOne(
  identifier: string,
  filePath: string,
  dryRun: boolean,
  resolveAirtableIdFcu: (table: ReseauTable, id_sncu: string) => Promise<number | null>
): Promise<Action> {
  const prefix = dryRun ? '[DRY-RUN] ' : '';

  // Numeric filename → id_fcu path: always reseaux_de_chaleur, update-only (no insert).
  if (/^\d+$/.test(identifier)) {
    const id_fcu = parseInt(identifier, 10);
    try {
      const parsed = JSON.parse(await readFile(filePath, 'utf8')) as
        | GeoJSON.FeatureCollection
        | GeoJSON.GeometryCollection
        | GeoJSON.Geometry;
      const isEmpty =
        (parsed.type === 'FeatureCollection' && parsed.features.length === 0) ||
        (parsed.type === 'GeometryCollection' && parsed.geometries.length === 0);
      if (isEmpty) {
        logger.warn(`${prefix}${id_fcu}: fichier vide, ignoré`);
        return 'empty';
      }
      const geometryConfig = await processGeometry(parsed);
      if (geometryConfig.geom.type !== 'MultiLineString' && geometryConfig.geom.type !== 'Point') {
        logger.error(`${prefix}${id_fcu}: type de géométrie non autorisé (${geometryConfig.geom.type}), attendu MultiLineString ou Point`);
        return 'error';
      }
      if (dryRun) {
        logger.info(`${prefix}${id_fcu}: serait mis à jour dans reseaux_de_chaleur`);
        return 'updated';
      }
      // updateEntityGeometry throws if id_fcu not found — no separate existence check needed.
      await updateEntityGeometry('reseaux_de_chaleur', 'id_fcu', id_fcu, geometryConfig);
      logger.info(`${prefix}${id_fcu}: mis à jour dans reseaux_de_chaleur`);
      return 'updated';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`${id_fcu}: ${message}`);
      return 'error';
    }
  }

  const id_sncu = identifier;
  try {
    const table = networkTableForId(id_sncu);
    if (!table) {
      logger.error(`${prefix}${id_sncu}: identifiant inattendu (ni C ni F), ignoré`);
      return 'error';
    }

    const parsed = JSON.parse(await readFile(filePath, 'utf8')) as
      | GeoJSON.FeatureCollection
      | GeoJSON.GeometryCollection
      | GeoJSON.Geometry;

    const isEmpty =
      (parsed.type === 'FeatureCollection' && parsed.features.length === 0) ||
      (parsed.type === 'GeometryCollection' && parsed.geometries.length === 0);
    if (isEmpty) {
      logger.warn(`${prefix}${id_sncu}: fichier vide, ignoré`);
      return 'empty';
    }

    // Toujours parsé/validé, y compris en dry-run, pour que la prévisualisation soit fidèle.
    const geometryConfig = await processGeometry(parsed);

    // Pour un réseau de chaleur/froid, seuls un tracé (MultiLineString) ou une localisation (Point) sont valides.
    if (geometryConfig.geom.type !== 'MultiLineString' && geometryConfig.geom.type !== 'Point') {
      logger.error(`${prefix}${id_sncu}: type de géométrie non autorisé (${geometryConfig.geom.type}), attendu MultiLineString ou Point`);
      return 'error';
    }

    const existing = await kdb.selectFrom(table).select('id_fcu').where('Identifiant reseau', '=', id_sncu).executeTakeFirst();

    if (!existing) {
      // Réseau absent de Postgres : on ne crée PAS de ligne Airtable, on récupère au contraire
      // son id_fcu depuis Airtable (source de vérité) pour créer la ligne Postgres correspondante.
      const idFcu = await resolveAirtableIdFcu(table, id_sncu);
      if (idFcu === null) {
        logger.error(`${prefix}${id_sncu}: absent de la BDD et introuvable sur Airtable, id_fcu indéterminable, ignoré`);
        return 'error';
      }
      if (dryRun) {
        logger.info(`${prefix}${id_sncu}: serait créé dans ${table} (id_fcu ${idFcu} depuis Airtable)`);
        return 'created';
      }
      await insertEntityWithGeometry(table, geometryConfig, { id_fcu: idFcu, id_sncu });
      return 'created';
    }

    if (dryRun) {
      logger.info(`${prefix}${id_sncu}: serait mis à jour dans ${table}`);
      return 'updated';
    }
    await updateEntityGeometry(table, 'Identifiant reseau', id_sncu, geometryConfig);
    return 'updated';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`${id_sncu}: ${message}`);
    return 'error';
  }
}

/**
 * Résout l'id_fcu d'un réseau depuis Airtable à partir de son identifiant SNCU.
 * Tous les records d'une table sont chargés au premier besoin puis mis en cache (≤1 requête par table).
 */
function createAirtableIdFcuResolver() {
  const cache = new Map<ReseauTable, Map<string, number>>();

  async function indexFor(table: ReseauTable): Promise<Map<string, number>> {
    const cached = cache.get(table);
    if (cached) return cached;

    const records = await AirtableDB(airtableTableForReseau[table])
      .select({ fields: ['Identifiant reseau', 'id_fcu'] })
      .all();
    const index = new Map<string, number>();
    for (const record of records) {
      const idSncu = record.get('Identifiant reseau');
      const idFcu = record.get('id_fcu');
      if (typeof idSncu === 'string' && typeof idFcu === 'number') {
        index.set(idSncu, idFcu);
      }
    }
    cache.set(table, index);
    return index;
  }

  return async (table: ReseauTable, id_sncu: string): Promise<number | null> => {
    return (await indexFor(table)).get(id_sncu) ?? null;
  };
}
