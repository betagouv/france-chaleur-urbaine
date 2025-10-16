import geojsonvt from 'geojson-vt';
import { sql, type Transaction } from 'kysely';
import vtpbf from 'vt-pbf';
import { tileSourcesMaxZoom } from '@/components/Map/layers/common';
import type { ApplyGeometriesUpdatesInput } from '@/modules/reseaux/constants';
import type { BuildTilesInput, GetBdnbBatimentInput } from '@/modules/tiles/constants';
import { type AirtableTileInfo, type DatabaseSourceId, tilesInfo } from '@/modules/tiles/tiles.config';
import db from '@/server/db';
import base from '@/server/db/airtable';
import { type DB, kdb } from '@/server/db/kysely';
import type { ApiContext } from '@/server/db/kysely/base-model';
import { isDefined } from '@/utils/core';

const debug = !!(process.env.API_DEBUG_MODE || null);

let airtableDayCached = 0;
const airtableTiles: Partial<Record<DatabaseSourceId, any>> = {
  demands: null,
};

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
  { internalName: 'reseaux-de-chaleur', tileName: 'network' },
  { internalName: 'reseaux-de-froid', tileName: 'coldNetwork' },
  { internalName: 'reseaux-en-construction', tileName: 'futurNetwork' },
  { internalName: 'perimetres-de-developpement-prioritaire', tileName: 'zoneDP' },
] as const;

export const getTileNameFromInternalName = (internalName: string) => {
  return tilesMapping.find((item) => item.internalName === internalName)?.tileName;
};

const getObjectIndexFromAirtable = async (tileInfo: AirtableTileInfo) => {
  return base(tileInfo.table)
    .select()
    .all()
    .then((records) => {
      const features = records.map((record) => {
        const longitude = record.get('Longitude') as number;
        const latitude = record.get('Latitude') as number;
        return {
          geometry: {
            coordinates: [longitude, latitude],
            type: 'Point',
          },
          properties: tileInfo.properties.reduce(
            (acc: any, key: string) => {
              const value = record.get(key);
              if (value) {
                acc[key] = value;
              }
              return acc;
            },
            { id: record.id }
          ),
          type: 'Feature',
        } satisfies GeoJSON.Feature<GeoJSON.Point>;
      });

      return geojsonvt(
        {
          features,
          type: 'FeatureCollection',
        },
        {
          maxZoom: tileSourcesMaxZoom,
        }
      );
    });
};

const cacheAirtableTiles = () => {
  airtableDayCached = new Date().getDate();
  Object.entries(tilesInfo).forEach(([type, tileInfo]) => {
    if (tileInfo.source === 'airtable') {
      const timerLabel = `⏱️  Indexing tiles for ${type} from airtable ${tileInfo.table}`;
      if (debug) {
        console.info(`${timerLabel}...`);
        console.time(timerLabel);
      }
      getObjectIndexFromAirtable(tileInfo)
        .then((result) => {
          airtableTiles[type as DatabaseSourceId] = result;
          if (debug) {
            console.timeEnd(timerLabel);
          }
        })
        .catch((e) => {
          if (debug) {
            console.timeEnd(timerLabel);
            console.error(`${timerLabel} failed`, e);
          }
        });
    }
  });
};

if (!isDefined(process.env.DISABLE_AIRTABLE_TILES_CACHE)) {
  cacheAirtableTiles();
}

export const getTile = async (
  type: DatabaseSourceId,
  x: number,
  y: number,
  z: number
): Promise<{ data: any; compressed: boolean } | null> => {
  const tileInfo = tilesInfo[type];
  if (tileInfo.source === 'database') {
    const result = await db(tileInfo.tiles).where('x', x).andWhere('y', y).andWhere('z', z).first();

    return result?.tile ? { compressed: !!tileInfo.compressedTiles, data: result?.tile } : null;
  }

  if (airtableDayCached !== new Date().getDate()) {
    cacheAirtableTiles();
  }

  const tiles = airtableTiles[type];
  if (!tiles) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);

  return tile
    ? {
        compressed: false,
        data: Buffer.from(vtpbf.fromGeojsonVt({ [tileInfo.sourceLayer]: tile }, { version: 2 })),
      }
    : null;
};

export const getBdnbBatimentDetails = async ({ batiment_groupe_id }: GetBdnbBatimentInput) => {
  const batiment = await kdb
    .selectFrom('bdnb_batiments')
    .select([
      // tout sauf geom et id
      'adresse_cle_interop_adr_principale_ban',
      'adresse_libelle_adr_principale_ban',
      'batiment_groupe_id',
      'code_commune_insee',
      'dle_elec_multimillesime_conso_pro',
      'dle_elec_multimillesime_conso_res',
      'dle_elec_multimillesime_conso_tot',
      'dle_gaz_multimillesime_conso_pro',
      'dle_gaz_multimillesime_conso_res',
      'dle_gaz_multimillesime_conso_tot',
      'dle_reseaux_multimillesime_conso_pro',
      'dle_reseaux_multimillesime_conso_res',
      'dle_reseaux_multimillesime_conso_tot',
      'dle_reseaux_multimillesime_type_reseau',
      'dpe_representatif_logement_classe_bilan_dpe',
      'dpe_representatif_logement_classe_emission_ges',
      'dpe_representatif_logement_surface_habitable_immeuble',
      'dpe_representatif_logement_type_batiment_dpe',
      'dpe_representatif_logement_type_dpe',
      'dpe_representatif_logement_type_energie_chauffage',
      'dpe_representatif_logement_type_generateur_chauffage',
      'dpe_representatif_logement_type_installation_chauffage',
      'ffo_bat_annee_construction',
      'ffo_bat_nb_log',
      'synthese_propriete_usage',
      'rnc_l_nom_copro',
      'constructions',
    ])
    .where('batiment_groupe_id', '=', batiment_groupe_id)
    .executeTakeFirstOrThrow();

  return batiment;
};
