import geojsonvt from 'geojson-vt';
import { sql, type Transaction } from 'kysely';
import vtpbf from 'vt-pbf';
import { tileSourcesMaxZoom } from '@/components/Map/layers/common';
import type { ApplyGeometriesUpdatesInput } from '@/modules/reseaux/constants';
import type { BuildTilesInput } from '@/modules/tiles/constants';
import { type DatabaseSourceId, tilesInfo } from '@/modules/tiles/tiles.config';
import { type DB, kdb } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { isDefined } from '@/utils/core';

const debug = !!(process.env.API_DEBUG_MODE || null);

let tilesCached = 0;
const cachedTiles: Partial<Record<DatabaseSourceId, any>> = Object.entries(tilesInfo)
  .filter(([_, tileInfo]) => tileInfo.source === 'database' && !!tileInfo.cache)
  .reduce((acc, [type]) => ({ ...acc, [type as DatabaseSourceId]: null }), {} as Partial<Record<DatabaseSourceId, any>>);

export const createBuildTilesJob = async (
  { name }: BuildTilesInput,
  context?: ApiContext,
  options?: { trx?: Transaction<DB>; replace?: boolean }
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

const tilesMapping = [
  { internalName: 'reseaux-de-chaleur', tileName: 'reseauxDeChaleur' },
  { internalName: 'reseaux-de-froid', tileName: 'reseauxDeFroid' },
  { internalName: 'reseaux-en-construction', tileName: 'reseauxEnConstruction' },
] as const;

export const getTileNameFromInternalName = (internalName: string) => {
  return tilesMapping.find((item) => item.internalName === internalName)?.tileName;
};

const populateTilesCache = () => {
  tilesCached = new Date().getDate();
  Promise.all(
    Object.entries(tilesInfo)
      .filter(([_, tileInfo]) => !!tileInfo.cache)
      .map(async ([type, tileInfo]) => {
        const timerLabel = `⏱️  Indexing tiles for ${type} sourceLayer ${tileInfo.sourceLayer}`;
        if (debug) {
          console.info(`${timerLabel}...`);
          console.time(timerLabel);
        }
        try {
          const features = await tileInfo.cache?.(tileInfo.properties ?? []);

          if (!features) {
            throw new Error(`No features found for ${type} sourceLayer ${tileInfo.sourceLayer}`);
          }

          cachedTiles[type as DatabaseSourceId] = geojsonvt(
            {
              features: (features as any) ?? [],
              type: 'FeatureCollection',
            },
            {
              maxZoom: tileSourcesMaxZoom,
            }
          );
          if (debug) {
            console.timeEnd(timerLabel);
          }
        } catch (e) {
          if (debug) {
            console.timeEnd(timerLabel);
            console.error(`${timerLabel} failed`, e);
          }
        }
      })
  );
};

// pas de cache au build de nextjs
if (!isDefined(process.env.NEXT_PHASE) && !isDefined(process.env.DISABLE_TILES_CACHE)) {
  populateTilesCache();
}

export const getTile = async (
  type: DatabaseSourceId,
  x: number,
  y: number,
  z: number
): Promise<{ data: any; compressed: boolean } | null> => {
  const tileInfo = tilesInfo[type];
  if (tileInfo.source === 'database') {
    const result = await kdb
      .selectFrom(tileInfo.tiles as any)
      .select('tile')
      .where((eb) =>
        eb.and({
          x,
          y,
          z,
        })
      )
      .executeTakeFirst();

    return result?.tile ? { compressed: !!tileInfo.compressedTiles, data: result?.tile } : null;
  }

  if (tilesCached !== new Date().getDate()) {
    populateTilesCache();
  }

  const tiles = cachedTiles[type];
  if (!tiles) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);

  return tile
    ? {
        compressed: false,
        data: Buffer.from(vtpbf.fromGeojsonVt({ layer: tile }, { version: 2 })),
      }
    : null;
};
