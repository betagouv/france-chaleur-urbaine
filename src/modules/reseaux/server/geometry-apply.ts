import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { processGeometry } from '@/modules/geo/server/helpers';
import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

import { updateEntityGeometry } from './geometry-operations';

type Statut = 'updated' | 'would_update' | 'missing' | 'empty' | 'error';

function networkTableForId(id_sncu: string): 'reseaux_de_chaleur' | 'reseaux_de_froid' | null {
  if (id_sncu.endsWith('C')) return 'reseaux_de_chaleur';
  if (id_sncu.endsWith('F')) return 'reseaux_de_froid';
  return null;
}

export async function applyNetworkGeometries(directory: string, options: { dryRun: boolean }): Promise<void> {
  const entries = await readdir(directory);
  const files = entries.filter((f) => f.toLowerCase().endsWith('.geojson')).sort();

  if (files.length === 0) {
    logger.warn(`Aucun fichier .geojson trouvé dans ${directory}`);
    return;
  }

  const prefix = options.dryRun ? '[DRY-RUN] ' : '';
  logger.info(`${prefix}Application des géométries depuis ${files.length} fichiers GeoJSON`);

  // Sequential: each file does a SELECT + UPDATE + label refresh; keeping it serial avoids
  // lock contention on the labels and gives predictable log ordering.
  const results: Statut[] = [];
  for (const file of files) {
    const id_sncu = path.basename(file, path.extname(file));
    results.push(await applyOne(id_sncu, path.join(directory, file), options.dryRun));
  }

  const counts = results.reduce<Record<Statut, number>>((acc, s) => ({ ...acc, [s]: acc[s] + 1 }), {
    empty: 0,
    error: 0,
    missing: 0,
    updated: 0,
    would_update: 0,
  });

  logger.info(`${prefix}Résumé:`);
  if (counts.updated > 0) logger.info(`  ${counts.updated} mis à jour`);
  if (counts.would_update > 0) logger.info(`  ${counts.would_update} seraient mis à jour`);
  if (counts.empty > 0) logger.warn(`  ${counts.empty} fichiers vides ignorés`);
  if (counts.missing > 0) logger.warn(`  ${counts.missing} ID absents en BDD ignorés`);
  if (counts.error > 0) logger.error(`  ${counts.error} erreurs`);

  if (options.dryRun) {
    logger.info(`Aucune modification effectuée. Relancer avec --apply pour exécuter.`);
  }
}

async function applyOne(id_sncu: string, filePath: string, dryRun: boolean): Promise<Statut> {
  const prefix = dryRun ? '[DRY-RUN] ' : '';
  try {
    const table = networkTableForId(id_sncu);
    if (!table) {
      logger.warn(`${prefix}${id_sncu}: identifiant inattendu (ni C ni F), ignoré`);
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

    const existing = await kdb.selectFrom(table).select('id_fcu').where('Identifiant reseau', '=', id_sncu).executeTakeFirst();
    if (!existing) {
      logger.warn(`${prefix}${id_sncu}: aucun réseau correspondant en BDD, ignoré`);
      return 'missing';
    }

    if (dryRun) {
      logger.info(`${prefix}${id_sncu}: serait mis à jour dans ${table}`);
      return 'would_update';
    }

    const geometryConfig = await processGeometry(parsed);
    await updateEntityGeometry(table, 'Identifiant reseau', id_sncu, geometryConfig);
    return 'updated';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`${id_sncu}: ${message}`);
    return 'error';
  }
}
