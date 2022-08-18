import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import db from 'src/db';
import base from 'src/db/airtable';

const debug = !!(process.env.API_DEBUG_MODE || null);

type PropertyType = string | [string, string];
type DataType =
  | 'network'
  | 'gas'
  | 'energy'
  | 'zoneDP'
  | 'demands'
  | 'buildings';

const preTable: Record<string, string> = {
  'pre-table-energy': `
    SELECT addr.rownum as id, addr.geom AS geom, addr.etaban202111_id,
      bati.etaban202111_label AS addr_label,
      bati.cerffo2020_annee_construction AS annee_construction,
      CASE
        WHEN bati.cerffo2020_nb_log ISNULL 
          THEN bati.anarnc202012_nb_log
        WHEN bati.cerffo2020_nb_log < 1 
          THEN bati.anarnc202012_nb_log
        ELSE bati.cerffo2020_nb_log
      END nb_logements,
      bati.adedpe202006_logtype_ch_type_ener_corr AS energie_utilisee
    FROM "bnb_idf - adresse" AS "addr"
      INNER JOIN "bnb_idf - batiment" AS "bati"
      ON addr.etaban202111_id = bati.etaban202111_id
    WHERE addr.geom IS NOT NULL
      AND addr.fiabilite_niv_1 <> 'problème de géocodage'
      AND bati.bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
      AND bati.adedpe202006_logtype_ch_type_inst = 'collectif'
      AND (
        bati.adedpe202006_logtype_ch_type_ener_corr = 'gaz'
        OR bati.adedpe202006_logtype_ch_type_ener_corr = 'fioul'
      )`,
  'pre-table-buildings': `
    SELECT bati.rownum as id, bati.geom AS geom, bati.etaban202111_id,
      bati.etaban202111_label AS addr_label,
      bati.cerffo2020_annee_construction AS annee_construction,
      bati.cerffo2020_usage_niveau_1_txt AS type_usage,
      CASE
        WHEN bati.cerffo2020_nb_log ISNULL 
          THEN bati.anarnc202012_nb_log
        WHEN bati.cerffo2020_nb_log < 1 
          THEN bati.anarnc202012_nb_log
        ELSE bati.cerffo2020_nb_log
      END nb_logements,
      bati.adedpe202006_logtype_ch_type_inst AS type_chauffage,
      CASE
        WHEN bati.adedpe202006_logtype_ch_type_ener_corr <> '' 
          THEN bati.adedpe202006_logtype_ch_type_ener_corr
        ELSE bati.adedpe202006_logtype_ch_gen_lib_princ
      END energie_utilisee,
      bati.adedpe202006_mean_class_conso_ener AS dpe_energie,
      bati.adedpe202006_mean_class_estim_ges AS dpe_ges
    FROM "bnb_idf - adresse" AS "addr"
      INNER JOIN "bnb_idf - batiment" AS "bati"
      ON addr.etaban202111_id = bati.etaban202111_id
    WHERE bati.geom IS NOT NULL
      AND addr.fiabilite_niv_1 <> 'problème de géocodage'
      AND bati.bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
      AND bati.adedpe202006_logtype_ch_type_inst IS NOT NULL
      AND bati.adedpe202006_mean_class_conso_ener IS NOT NULL
      AND bati.adedpe202006_mean_class_estim_ges IS NOT NULL`,
};

const dbTable = (table: string) => {
  if (preTable[table]) {
    return db(table).with(table, db.raw(preTable[table]));
  }
  return db(table);
};

const geoJSONQuery = (properties: PropertyType[]) =>
  db.raw(
    `json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(json_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom,4326)))::json,
      'properties', json_build_object(
        ${properties
          .flatMap((property) =>
            Array.isArray(property)
              ? [
                  `'${property[0]}'`,
                  !/^ALIAS OF /.test(property[1].trim())
                    ? `'${property[1]}'`
                    : property[1].replace('ALIAS OF ', '').trim(),
                ]
              : [`'${property}'`, property]
          )
          .join(',')}
      )
    ))
  )`
  );

const getObjectIndexFromAirtable = async (
  table: string,
  tileOptions: geojsonvt.Options,
  properties: PropertyType[]
) => {
  return base(table)
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
          properties: (properties as string[]).reduce((acc: any, key) => {
            const value = record.get(key);
            if (value) {
              acc[key] = record.get(key);
            }
            return acc;
          }, {}),
        };
      });

      return geojsonvt(
        {
          type: 'FeatureCollection',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Create proper type
          features: features,
        },
        tileOptions
      );
    });
};

const getObjectIndexFromDatabase = async (
  table: string,
  tileOptions: geojsonvt.Options,
  properties: PropertyType[]
) => {
  const geoJSON = process.env.LIMIT_NETWORK_RESULTS
    ? await dbTable(table)
        .first(geoJSONQuery(properties))
        .whereNotNull('geom')
        .andWhere(db.raw(`id < ${process.env.LIMIT_NETWORK_RESULTS}`))
    : await dbTable(table).first(geoJSONQuery(properties)).whereNotNull('geom');
  return geojsonvt(geoJSON.json_build_object, tileOptions);
};

const { maxZoom, minZoomData } = mapParam;
const allTiles: Record<DataType, any> = {
  demands: null,
  network: null,
  gas: null,
  energy: null,
  zoneDP: null,
  buildings: null,
};

const tilesInfo: Record<
  DataType,
  {
    source: 'database' | 'airtable';
    table: string;
    minZoom?: number;
    options: geojsonvt.Options;
    properties: PropertyType[];
    sourceLayer: string;
  }
> = {
  demands: {
    source: 'airtable',
    table: 'FCU - Utilisateurs',
    options: {
      maxZoom,
    },
    properties: ['Mode de chauffage', 'Adresse'],
    sourceLayer: 'demands',
  },
  network: {
    source: 'database',
    table: 'reseaux_de_chaleur_new',
    options: {
      maxZoom,
      tolerance: 0,
    },
    properties: ['id'],
    sourceLayer: 'outline',
  },
  energy: {
    source: 'database',
    table: 'pre-table-energy',
    minZoom: minZoomData,
    options: {
      maxZoom,
    },
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
    table: 'conso_gaz_2020_r11_geocoded',
    minZoom: minZoomData,
    options: {
      maxZoom,
    },
    properties: ['id', 'code_grand_secteur', 'conso', 'result_label'],
    sourceLayer: 'gasUsage',
  },
  zoneDP: {
    source: 'database',
    table: 'zone_de_developpement_prioritaire',
    options: {
      maxZoom,
    },
    properties: ['id'],
    sourceLayer: 'zoneDP',
  },
  buildings: {
    source: 'database',
    table: 'pre-table-buildings',
    minZoom: minZoomData,
    options: {
      maxZoom,
    },
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
Object.entries(tilesInfo).forEach(
  ([type, { source, table, options, properties }]) => {
    debug && console.info(`Indexing tiles for ${type} with ${table}...`);
    const getter =
      source === 'airtable'
        ? getObjectIndexFromAirtable
        : getObjectIndexFromDatabase;
    promiseGetters.push(
      getter(table, options, properties).then((result) => {
        allTiles[type as DataType] = result;
        debug && console.info(`Indexing tiles for ${type} with ${table} done`);
      })
    );
  }
);
Promise.all(promiseGetters).then(
  () => debug && console.info(`Indexing tiles finished`)
);

const getTiles = (type: DataType, x: number, y: number, z: number) => {
  const tiles = allTiles[type];
  if (!tiles) {
    return null;
  }

  const tileInfo = tilesInfo[type];
  if (tileInfo.minZoom && tileInfo.minZoom > z) {
    return null;
  }

  const tile = tiles.getTile(z, x, y);
  return tile ? { [tileInfo.sourceLayer]: tile } : null;
};

export default getTiles;
