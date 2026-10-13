import GeoJSONVT from 'geojson-vt';
import { sql, type Transaction } from 'kysely';
import vtpbf from 'vt-pbf';

import type { BuildTilesInput } from '@/modules/tiles/constants';
import { type CacheTileSourceId, type TileSourceId, tileSourcesConfig } from '@/modules/tiles/server/tiles.config';
import { type DB, kdb } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import { ObjectEntries } from '@/utils/typescript';

const TILES_METADATA_TTL_MS = 60_000;

type TilesCacheState = {
  cachedTilesIndex: Partial<Record<CacheTileSourceId, any>>;
  /** Day of month of the last build of the dynamic indexes (refreshed daily) */
  tilesCacheDay: number;
  tilesMetadataCache: Map<TileSourceId, { lastModified: Date; expiresAt: number }>;
};

const GLOBAL_KEY = '__fcuTilesCache__';

// In Next.js, instrumentation.ts and pages/api are separate bundles that each get
// their own instance of this module. The state is deduplicated via globalThis so the
// index built at startup is the one served by the API (same pattern as metrics/server/registry.ts).
const globalScope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: TilesCacheState };

const state: TilesCacheState = (globalScope[GLOBAL_KEY] ??= {
  cachedTilesIndex: {},
  tilesCacheDay: 0,
  tilesMetadataCache: new Map(),
});

/**
 * Marque une source de tuiles comme mise à jour : upsert dans `tiles_metadata`
 * et invalide le cache mémoire TTL associé. À appeler explicitement à la fin
 * de chaque chemin d'écriture (import tippecanoe, rebuild `demands`, CLI bump).
 */
export const markTilesUpdated = async (sourceId: TileSourceId): Promise<void> => {
  await kdb
    .insertInto('tiles_metadata')
    .values({ last_modified_at: new Date(), source_id: sourceId })
    .onConflict((oc) => oc.column('source_id').doUpdateSet({ last_modified_at: new Date() }))
    .execute();
  state.tilesMetadataCache.delete(sourceId);
};

/**
 * Retourne la date de dernière mise à jour d'une source de tuiles, ou null
 * si aucune ligne n'existe. Mis en cache mémoire 60s pour éviter une requête
 * DB par tuile servie.
 */
export const getTileLastModified = async (sourceId: TileSourceId): Promise<Date | null> => {
  const now = Date.now();
  const cached = state.tilesMetadataCache.get(sourceId);
  if (cached && cached.expiresAt > now) {
    return cached.lastModified;
  }

  const row = await kdb.selectFrom('tiles_metadata').select('last_modified_at').where('source_id', '=', sourceId).executeTakeFirst();

  if (!row) {
    return null;
  }
  state.tilesMetadataCache.set(sourceId, { expiresAt: now + TILES_METADATA_TTL_MS, lastModified: row.last_modified_at });
  return row.last_modified_at;
};

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

/**
 * Peuple le cache des tuiles pour les sources avec cache dynamique.
 * Le cache est rafraîchi chaque jour.
 */
export const populateTilesCache = () => {
  state.tilesCacheDay = new Date().getDate();
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

        state.cachedTilesIndex[sourceId as CacheTileSourceId] = new GeoJSONVT(
          {
            features: features as GeoJSON.Feature<GeoJSON.Point>[],
            type: 'FeatureCollection',
          },
          {
            maxZoom: 15,
          }
        );
        await markTilesUpdated(sourceId);

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
    if (state.tilesCacheDay !== new Date().getDate()) {
      populateTilesCache();
    }

    const tileIndex = state.cachedTilesIndex[sourceId as CacheTileSourceId];
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
