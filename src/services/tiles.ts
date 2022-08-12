import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import db from 'src/db';
import base from 'src/db/airtable';
import { meaningFullEnergies } from 'src/types/enum/EnergyType';

const debug = !!(process.env.API_DEBUG_MODE || null);

type DataType = 'network' | 'gas' | 'energy' | 'zoneDP' | 'demands';

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

const getObjectIndexFromAirtable = async (
  table: string,
  tileOptions: geojsonvt.Options,
  properties: string[]
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
          properties: properties.reduce(function (acc: any, key: string) {
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
  properties: string[]
) => {
  let geoJSON;
  if (table === 'registre_copro_r11_220125') {
    geoJSON = process.env.LIMIT_NETWORK_RESULTS
      ? await db(table)
          .first(geoJSONQuery(properties))
          .whereIn('energie_utilisee', meaningFullEnergies)
          .whereNotNull('geom')
          .andWhere(db.raw(`id < ${process.env.LIMIT_NETWORK_RESULTS}`))
      : await db(table).first(geoJSONQuery(properties)).whereNotNull('geom');
  } else {
    geoJSON = process.env.LIMIT_NETWORK_RESULTS
      ? await db(table)
          .first(geoJSONQuery(properties))
          .whereNotNull('geom')
          .andWhere(db.raw(`id < ${process.env.LIMIT_NETWORK_RESULTS}`))
      : await db(table).first(geoJSONQuery(properties)).whereNotNull('geom');
  }

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
    properties: string[];
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
    table: 'registre_copro_r11_220125',
    minZoom: minZoomData,
    options: {
      maxZoom,
    },
    properties: ['id', 'nb_lot_habitation_bureau_commerce', 'energie_utilisee'],
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
