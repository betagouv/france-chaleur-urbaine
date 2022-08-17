import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import db from 'src/db';
import base from 'src/db/airtable';

const debug = !!(process.env.API_DEBUG_MODE || null);

type PropertyType = string | [string, string];
type DataType = 'network' | 'gas' | 'energy' | 'zoneDP' | 'demands';

const preTable: Record<string, string> = {
  'pre-table-energy': `
    SELECT addr.rownum as "id", addr.fid, addr.geom AS geom,
      addr.etaban202111_id,
      TRIM(CONCAT(
        addr.etaban202111_numero,
        ' ', addr.etaban202111_voie,
        ' ', addr.etaban202111_code_postal,
        ' ', addr.etaban202111_ville
      )) AS addr_label,
      addr.etaban202111_numero AS addr_numero,
      addr.etaban202111_voie AS addr_voie,
      addr.etaban202111_code_postal AS addr_cp,
      addr.etaban202111_code_insee AS addr_insee,
      addr.etaban202111_ville AS addr_ville,
      bati.cerffo2020_nb_log AS nb_logements,
      bati.adedpe202006_logtype_ch_type_ener_corr AS energie_utilisee,
      bati.adedpe202006_logtype_ch_type_inst AS type_chauffage,
      bati.adedpe202006_mean_class_conso_ener AS dpe_energie,
      bati.adedpe202006_mean_class_estim_ges AS dpe_ges
      FROM "bnb_idf - adresse" AS "addr"
    INNER JOIN "bnb_idf - batiment" AS "bati"
    ON addr.etaban202111_id = bati.etaban202111_id
    WHERE addr.fiabilite_niv_1 <> 'problème de géocodage'
    AND bati.bnb_adr_fiabilite_niv_1 <> 'problème de géocodage'
    AND bati.cerffo2020_nb_log > 0
    AND bati.adedpe202006_logtype_ch_type_ener_corr <> ''
    AND bati.adedpe202006_logtype_ch_type_inst IS NOT NULL
    AND bati.adedpe202006_mean_class_conso_ener IS NOT NULL
    AND bati.adedpe202006_mean_class_estim_ges IS NOT NULL
      ORDER BY addr.rownum`,
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
      'energie_utilisee',
      'addr_label',
      'addr_numero',
      'addr_voie',
      'addr_cp',
      'addr_insee',
      'addr_ville',
    ],
    sourceLayer: 'condominiumRegister',
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
};

Object.entries(tilesInfo).forEach(
  ([type, { source, table, options, properties }]) => {
    debug && console.info(`Indexing tiles for ${type} with ${table}...`);
    const getter =
      source === 'airtable'
        ? getObjectIndexFromAirtable
        : getObjectIndexFromDatabase;
    getter(table, options, properties).then((result) => {
      allTiles[type as DataType] = result;
      debug && console.info(`Indexing tiles for ${type} with ${table} done`);
    });
  }
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
