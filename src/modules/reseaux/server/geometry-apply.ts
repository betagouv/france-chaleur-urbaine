import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { processGeometry } from '@/modules/geo/server/helpers';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

import { networkTableForId } from '../constants';
import { insertEntityWithGeometry, updateEntityGeometry } from './geometry-operations';

// Action réalisée (ou qui le serait en dry-run) pour un fichier.
type Action = 'created' | 'updated' | 'empty' | 'error';

// Tables réseau gérées par la commande (chaleur / froid).
type ReseauTable = NonNullable<ReturnType<typeof networkTableForId>>;

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

  // Sequential: each file does a SELECT + INSERT/UPDATE + label refresh; keeping it serial avoids
  // lock contention on the labels and gives predictable log ordering.
  const results: Action[] = [];
  for (const file of files) {
    const identifier = path.basename(file, path.extname(file));
    results.push(await applyOne(identifier, path.join(directory, file), dryRun));
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

async function applyOne(identifier: string, filePath: string, dryRun: boolean): Promise<Action> {
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
      // Réseau absent de la base : créé avec un id_fcu attribué automatiquement
      if (dryRun) {
        logger.info(`${prefix}${id_sncu}: serait créé dans ${table}`);
        return 'created';
      }
      await insertEntityWithGeometry(table, geometryConfig, { id_sncu });
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
