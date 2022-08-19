import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import { Knex } from 'knex';
import db from 'src/db';
import base from 'src/db/airtable';

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
  properties: string[];
  sourceLayer: string;
};

type AirtableTileInfo = BasicTileInfo & {
  source: 'airtable';
};

type DatabaseTileInfo = BasicTileInfo & {
  source: 'database';
  extraWhere: (query: Knex.QueryBuilder) => Knex.QueryBuilder;
  id: string;
};

type TileInfo = AirtableTileInfo | DatabaseTileInfo;

type DataType =
  | 'network'
  | 'gas'
  | 'energy'
  | 'zoneDP'
  | 'demands'
  | 'buildings';

const preTable: Record<string, string> = {
  'pre-table-energy': `
    SELECT rownum as id, geom_adresse AS geom, etaban202111_id,
      etaban202111_label AS addr_label,
      cerffo2020_annee_construction AS annee_construction,
      CASE
        WHEN cerffo2020_nb_log ISNULL 
          THEN anarnc202012_nb_log
        WHEN cerffo2020_nb_log < 1 
          THEN anarnc202012_nb_log
        ELSE cerffo2020_nb_log
      END nb_logements,
      adedpe202006_logtype_ch_type_ener_corr AS energie_utilisee,
      adedpe202006_mean_class_conso_ener AS dpe_energie,
      adedpe202006_mean_class_estim_ges AS dpe_ges
    FROM "bnb_idf - batiment_adresse"
    WHERE geom IS NOT NULL
      AND bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
      AND adedpe202006_logtype_ch_type_inst = 'collectif'
      AND (
        adedpe202006_logtype_ch_type_ener_corr = 'gaz'
        OR adedpe202006_logtype_ch_type_ener_corr = 'fioul'
      )`,
  'pre-table-buildings': `
    SELECT rownum as id, geom AS geom, etaban202111_id,
      etaban202111_label AS addr_label,
      cerffo2020_annee_construction AS annee_construction,
      cerffo2020_usage_niveau_1_txt AS type_usage,
      CASE
        WHEN cerffo2020_nb_log ISNULL 
          THEN anarnc202012_nb_log
        WHEN cerffo2020_nb_log < 1 
          THEN anarnc202012_nb_log
        ELSE cerffo2020_nb_log
      END nb_logements,
      adedpe202006_logtype_ch_type_inst AS type_chauffage,
      CASE
        WHEN adedpe202006_logtype_ch_type_ener_corr <> '' 
          THEN adedpe202006_logtype_ch_type_ener_corr
        ELSE adedpe202006_logtype_ch_gen_lib_princ
      END energie_utilisee,
      adedpe202006_mean_class_conso_ener AS dpe_energie,
      adedpe202006_mean_class_estim_ges AS dpe_ges
    FROM "bnb_idf - batiment_adresse"
    WHERE geom IS NOT NULL
      AND bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'`,
};

const dbTable = (table: string) => {
  if (preTable[table]) {
    return db(table).with(table, db.raw(preTable[table]));
  }
  return db(table);
};

const geoJSONQuery = (properties: string[]) =>
  db.raw(
    `json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(json_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom,4326)))::json,
      'properties', json_build_object(
        ${properties
          .flatMap((property) => [`'${property}'`, property])
          .join(',')}
      )
    ))
  )`
  );

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

const getObjectIndexFromDatabase = async (tileInfo: DatabaseTileInfo) => {
  const geoJSON = process.env.LIMIT_NETWORK_RESULTS
    ? await tileInfo
        .extraWhere(
          dbTable(tileInfo.table).first(geoJSONQuery(tileInfo.properties))
        )
        .whereNotNull('geom')
        .andWhere(
          db.raw(`${tileInfo.id} < ${process.env.LIMIT_NETWORK_RESULTS}`)
        )
    : await tileInfo
        .extraWhere(
          dbTable(tileInfo.table).first(geoJSONQuery(tileInfo.properties))
        )
        .whereNotNull('geom');

  return geojsonvt(geoJSON.json_build_object, {
    maxZoom: mapParam.maxZoom,
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
    id: 'id',
    extraWhere: (query) => query,
    properties: ['id'],
    sourceLayer: 'outline',
  },
  energy: {
    source: 'database',
    table: 'pre-table-energy',
    minZoom: true,
    id: 'id',
    extraWhere: (query) => query,
    properties: [
      'id',
      'nb_logements',
      'annee_construction',
      'energie_utilisee',
      'addr_label',
    ],
    sourceLayer: 'energy',
  },
  gas: {
    source: 'database',
    table: 'Donnees_de_conso_et_pdl_gaz_nat_2020',
    minZoom: true,
    id: 'rownum',
    extraWhere: (query) => query.whereIn('code_grand', ['R', 'T', 'I']),
    properties: ['rownum', 'code_grand', 'conso_nb', 'adresse', 'pdl_nb'],
    sourceLayer: 'gasUsage',
  },
  zoneDP: {
    source: 'database',
    table: 'zone_de_developpement_prioritaire',
    id: 'id',
    extraWhere: (query) => query,
    properties: ['id'],
    sourceLayer: 'zoneDP',
  },
  buildings: {
    source: 'database',
    table: 'pre-table-buildings',
    minZoom: true,
    id: 'id',
    extraWhere: (query) => query,
    properties: [
      'id',
      'nb_logements',
      'annee_construction',
      'type_usage',
      'energie_utilisee',
      'type_chauffage',
      'addr_label',
      'dpe_energie',
      'dpe_ges',
    ],
    sourceLayer: 'buildings',
  },
};

const promiseGetters: Promise<unknown>[] = [];
Object.entries(tilesInfo).forEach(([type, tileInfo]) => {
  debug && console.info(`Indexing tiles for ${type} with ${tileInfo.table}...`);
  const getter = (tileInfo: TileInfo) =>
    tileInfo.source === 'airtable'
      ? getObjectIndexFromAirtable(tileInfo)
      : getObjectIndexFromDatabase(tileInfo);
  promiseGetters.push(
    getter(tileInfo)
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
      )
  );
});

Promise.all(promiseGetters).then(
  () => debug && console.info(`Indexing tiles finished`)
);

const getTiles = (type: DataType, x: number, y: number, z: number) => {
  const tiles = allTiles[type];
  if (!tiles) {
    return null;
  }

  const tileInfo = tilesInfo[type];
  if (tileInfo.minZoom && mapParam.minZoom > z) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);
  return tile ? { [tileInfo.sourceLayer]: tile } : null;
};

export default getTiles;
