import geojsonvt from 'geojson-vt';
import { sql, type Transaction } from 'kysely';
import vtpbf from 'vt-pbf';

import type { ApplyGeometriesUpdatesInput } from '@/modules/reseaux/constants';
import type { BuildTilesInput } from '@/modules/tiles/constants';
import { type CacheTileSourceId, type TileSourceId, tileSourcesConfig } from '@/modules/tiles/server/tiles.config';
import { type DB, kdb } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import { ObjectEntries } from '@/utils/typescript';

let tilesCacheDay = 0;
const cachedTilesIndex: Partial<Record<CacheTileSourceId, any>> = {};

export const createBuildTilesJob = async (
  { name }: BuildTilesInput,
  context?: ApiContext,
  options?: { replace?: boolean; trx?: Transaction<DB> }
) => {
  if (options?.replace) {
    await (options?.trx || kdb)
      .deleteFrom('jobs')
      .where('type', '=', 'build_tiles')
      .where(sql`data->>'name'`, '=', name)
      .where('status', '=', 'pending')
      .execute();
  }

  return await (options?.trx || kdb)
    .insertInto('jobs')
    .values({
      data: {
        name,
      },
      status: 'pending',
      type: 'build_tiles',
      user_id: context?.user?.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createSyncGeometriesToAirtableJob = async ({ name }: ApplyGeometriesUpdatesInput, context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      data: { name },
      status: 'pending',
      type: 'sync_geometries_to_airtable',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const createSyncMetadataFromAirtableJob = async ({ name }: ApplyGeometriesUpdatesInput, context: ApiContext) => {
  return await kdb
    .insertInto('jobs')
    .values({
      data: { name },
      status: 'pending',
      type: 'sync_metadata_from_airtable',
      user_id: context.user.id,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

/**
 * Peuple le cache des tuiles pour les sources avec cache dynamique.
 * Le cache est rafraîchi chaque jour.
 */
export const populateTilesCache = () => {
  tilesCacheDay = new Date().getDate();
  Promise.all(
    ObjectEntries(tileSourcesConfig).map(async ([sourceId, config]) => {
      if (!('cache' in config)) return;

      const logger = parentLogger.child({ sourceId });
      const startTime = Date.now();

      logger.info('indexing tiles for source');

      try {
        const features = await config.cache(config.properties);

        if (!features) {
          throw new Error(`No features found for ${sourceId}`);
        }

        cachedTilesIndex[sourceId as CacheTileSourceId] = geojsonvt(
          {
            features: features as GeoJSON.Feature<GeoJSON.Point>[],
            type: 'FeatureCollection',
          },
          {
            maxZoom: 15,
          }
        );

        const duration = Date.now() - startTime;
        logger.info('tiles indexed successfully', { duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('failed to index tiles', { duration, error });
      }
    })
  );
};

/**
 * Récupère une tuile vectorielle pour une source donnée.
 *
 * @param sourceId - Identifiant de la source de tuiles
 * @param x - Coordonnée X de la tuile
 * @param y - Coordonnée Y de la tuile
 * @param z - Niveau de zoom
 * @returns Les données de la tuile et si elles sont compressées, ou null si non trouvée
 */
export const getTile = async (
  sourceId: TileSourceId,
  x: number,
  y: number,
  z: number
): Promise<{ compressed: boolean; data: Buffer } | null> => {
  const config = tileSourcesConfig[sourceId];

  // Source servie depuis la base de données
  if ('tilesTableName' in config) {
    const result = await kdb
      .selectFrom(config.tilesTableName)
      .select('tile')
      .where((eb: any) => eb.and({ x, y, z }))
      .executeTakeFirst();

    return result?.tile
      ? {
          compressed: !('compressedTiles' in config && config.compressedTiles === false),
          data: result.tile,
        }
      : null;
  }

  // Source avec cache dynamique
  if ('cache' in config) {
    // Rafraîchir le cache si on a changé de jour
    if (tilesCacheDay !== new Date().getDate()) {
      populateTilesCache();
    }

    const tileIndex = cachedTilesIndex[sourceId as CacheTileSourceId];
    if (!tileIndex) {
      return null;
    }

    const tile = tileIndex.getTile(z, x, y);

    return tile
      ? {
          compressed: false,
          data: Buffer.from(vtpbf.fromGeojsonVt({ layer: tile }, { version: 2 })),
        }
      : null;
  }

  return null;
};
