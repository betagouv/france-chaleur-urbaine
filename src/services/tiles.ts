import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import db from 'src/db';
import base from 'src/db/airtable';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore: no types
import vtpbf from 'vt-pbf';

const debug = !!(process.env.API_DEBUG_MODE || null);

const allTiles: Record<DataType, any> = {
  demands: null,
  network: null,
  gas: null,
  energy: null,
  zoneDP: null,
  buildings: null,
};

type BasicTileInfo = {
  table: string;
  minZoom?: boolean;
  sourceLayer: string;
};

type AirtableTileInfo = BasicTileInfo & {
  source: 'airtable';
  properties: string[];
};

type DatabaseTileInfo = BasicTileInfo & {
  source: 'database';
  properties: string[] | [string, string][];
  where?: string;
  geom?: string;
};

type TileInfo = AirtableTileInfo | DatabaseTileInfo;

type DataType =
  | 'network'
  | 'gas'
  | 'energy'
  | 'zoneDP'
  | 'demands'
  | 'buildings';

const getObjectIndexFromAirtable = async (tileInfo: AirtableTileInfo) => {
  return base(tileInfo.table)
    .select()
    .all()
    .then((records) => {
      const features = records.map((record) => {
        const longitude = record.get('Longitude') as string;
        const latitude = record.get('Latitude') as string;
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          properties: tileInfo.properties.reduce(function (
            acc: any,
            key: string
          ) {
            const value = record.get(key);
            if (value) {
              acc[key] = value;
            }
            return acc;
          },
          {}),
        };
      });

      return geojsonvt(
        {
          type: 'FeatureCollection',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          features: features,
        },
        {
          maxZoom: mapParam.maxZoom,
        }
      );
    });
};

const tilesInfo: Record<DataType, TileInfo> = {
  demands: {
    source: 'airtable',
    table: 'FCU - Utilisateurs',
    properties: ['Mode de chauffage', 'Adresse'],
    sourceLayer: 'demands',
  },
  network: {
    source: 'database',
    table: 'reseaux_de_chaleur',
    properties: ['id'],
    sourceLayer: 'outline',
  },
  energy: {
    source: 'database',
    table: 'bnb_idf - batiment_adresse',
    geom: 'geom_adresse',
    minZoom: true,
    where: `
      bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
      AND adedpe202006_logtype_ch_type_inst = 'collectif'
      AND adedpe202006_logtype_ch_type_ener_corr in ('gaz', 'fioul')
    `,
    properties: [
      ['cerffo2020_nb_log', 'nb_logements'],
      ['cerffo2020_annee_construction', 'annee_construction'],
      ['cerffo2020_usage_niveau_1_txt', 'type_usage'],
      ['adedpe202006_logtype_ch_type_inst', 'type_chauffage'],
      ['adedpe202006_logtype_ch_type_ener_corr', 'energie_utilisee'],
      ['etaban202111_label', 'addr_label'],
      ['adedpe202006_mean_class_conso_ener', 'dpe_energie'],
      ['adedpe202006_mean_class_estim_ges', 'dpe_ges'],
    ],
    sourceLayer: 'energy',
  },
  gas: {
    source: 'database',
    table: 'Donnees_de_conso_et_pdl_gaz_nat_2020',
    minZoom: true,
    where: "code_grand in ('R', 'T', 'I')",
    properties: ['rownum', 'code_grand', 'conso_nb', 'adresse', 'pdl_nb'],
    sourceLayer: 'gasUsage',
  },
  zoneDP: {
    source: 'database',
    table: 'zone_de_developpement_prioritaire',
    properties: ['id'],
    sourceLayer: 'zoneDP',
  },
  buildings: {
    source: 'database',
    table: 'bnb_idf - batiment_adresse',
    minZoom: true,
    where: `
    bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
`,
    properties: [
      ['cerffo2020_nb_log', 'nb_logements'],
      ['cerffo2020_annee_construction', 'annee_construction'],
      ['cerffo2020_usage_niveau_1_txt', 'type_usage'],
      ['adedpe202006_logtype_ch_type_inst', 'type_chauffage'],
      ['adedpe202006_logtype_ch_type_ener_corr', 'energie_utilisee'],
      ['etaban202111_label', 'addr_label'],
      ['adedpe202006_mean_class_conso_ener', 'dpe_energie'],
      ['adedpe202006_mean_class_estim_ges', 'dpe_ges'],
    ],
    sourceLayer: 'buildings',
  },
};

Object.entries(tilesInfo).forEach(([type, tileInfo]) => {
  if (tileInfo.source === 'airtable') {
    debug &&
      console.info(`Indexing tiles for ${type} with ${tileInfo.table}...`);
    getObjectIndexFromAirtable(tileInfo)
      .then((result) => {
        allTiles[type as DataType] = result;
        debug &&
          console.info(
            `Indexing tiles for ${type} with ${tileInfo.table} done`
          );
      })
      .catch(
        (e) =>
          debug &&
          console.error(
            `Indexing tiles for ${type} with ${tileInfo.table} failed`,
            e
          )
      );
  }
});

const tileToEnvelope = (
  x: number,
  y: number,
  z: number
): { bounds: string; where: string } => {
  const worldMercMax = 20037508.3427892;
  const worldMercMin = -1 * worldMercMax;
  const worldMercSize = worldMercMax - worldMercMin;

  const worldTileSize = 2 ** z;
  const tileMercSize = worldMercSize / worldTileSize;

  const xmin = worldMercMin + tileMercSize * x;
  const xmax = worldMercMin + tileMercSize * (x + 1);
  const ymin = worldMercMax - tileMercSize * (y + 1);
  const ymax = worldMercMax - tileMercSize * y;

  return {
    bounds: `ST_MakeBox2D(ST_Point(${xmin}, ${ymin}), ST_Point(${xmax}, ${ymax}))`,
    where: `ST_Segmentize(ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}, 3857),${
      (xmax - xmin) / 4
    })`,
  };
};

const getTiles = async (type: DataType, x: number, y: number, z: number) => {
  const tileInfo = tilesInfo[type];
  if (tileInfo.source === 'database') {
    const envelope = tileToEnvelope(x, y, z);
    const tile = await db.raw(
      `
      WITH 
      mvtgeom AS (
        SELECT ST_AsMVTGeom(ST_Transform(${tileInfo.geom || 'geom'}, 3857), ${
        envelope.bounds
      }) AS geom, ${tileInfo.properties.map((property) =>
        Array.isArray(property)
          ? `${property[0]} as ${property[1]}`
          : `${property} as ${property}`
      )}
        FROM "${tileInfo.table}"
        WHERE ST_Intersects(
          ST_Transform(${tileInfo.geom || 'geom'}, 3857),
          ${envelope.where}
        )
        ${tileInfo.where ? `AND ${tileInfo.where}` : ''}
      ) 
      SELECT ST_AsMVT(mvtgeom.*, '${
        tileInfo.sourceLayer
      }') FROM mvtgeom where mvtgeom.geom is not null
    `
    );
    return tile.rows[0].st_asmvt;
  }
  const tiles = allTiles[type];
  if (!tiles) {
    return null;
  }

  if (tileInfo.minZoom && mapParam.minZoom > z) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);
  return Buffer.from(
    vtpbf.fromGeojsonVt({ [tileInfo.sourceLayer]: tile }, { version: 2 })
  );
};

export default getTiles;
