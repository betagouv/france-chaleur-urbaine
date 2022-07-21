import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import db from 'src/db';

const debug = !!(process.env.API_DEBUG_MODE || null);

type DataType = 'network' | 'gas' | 'energy' | 'zoneDP';

const geoJSONQuery = (properties: string[]) =>
  db.raw(
    `json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(json_build_object(
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_Transform(geom,4326))::json,
      'properties', json_build_object(
        ${properties
          .flatMap((property) => [`'${property}'`, property])
          .join(',')}
      )
    ))
  )`
  );

const getObjectIndex = async (
  table: string,
  tileOptions: geojsonvt.Options,
  properties: string[]
) => {
  const geoJSON = process.env.LIMIT_NETWORK_RESULTS
    ? await db(table)
        .first(geoJSONQuery(properties))
        .whereNotNull('geom')
        .andWhere(db.raw(`id < ${process.env.LIMIT_NETWORK_RESULTS}`))
    : await db(table).first(geoJSONQuery(properties)).whereNotNull('geom');

  return geojsonvt(geoJSON.json_build_object, tileOptions);
};

const { maxZoom, minZoomData } = mapParam;
const allTiles: Record<DataType, any> = {
  network: null,
  gas: null,
  energy: null,
  zoneDP: null,
};

const tilesInfo: Record<
  DataType,
  {
    table: string;
    minZoom?: number;
    options: geojsonvt.Options;
    properties: string[];
    sourceLayer: string;
  }
> = {
  network: {
    table: 'reseaux_de_chaleur_new',
    options: {
      maxZoom,
      tolerance: 0,
    },
    properties: ['id'],
    sourceLayer: 'outline',
  },
  energy: {
    table: 'registre_copro_r11_220125',
    options: {
      maxZoom,
    },
    properties: ['id', 'nb_lot_habitation_bureau_commerce', 'energie_utilisee'],
    sourceLayer: 'condominiumRegister',
  },
  gas: {
    table: 'conso_gaz_2020_r11_geocoded',
    minZoom: minZoomData,
    options: {
      maxZoom,
    },
    properties: ['id', 'code_grand_secteur', 'conso'],
    sourceLayer: 'gasUsage',
  },
  zoneDP: {
    table: 'zone_de_developpement_prioritaire',
    options: {
      maxZoom,
    },
    properties: ['id'],
    sourceLayer: 'zoneDP',
  },
};

Object.entries(tilesInfo).forEach(([type, { table, options, properties }]) => {
  debug && console.info(`Indexing tiles for ${type} with ${table}...`);
  getObjectIndex(table, options, properties).then((result) => {
    allTiles[type as DataType] = result;
    debug && console.info(`Indexing tiles for ${type} with ${table} done`);
  });
});

const getTiles = (type: DataType, x: number, y: number, z: number) => {
  const tiles = allTiles[type];
  if (!tiles) {
    return null;
  }

  const tileInfo = tilesInfo[type];
  return tileInfo.minZoom && tileInfo.minZoom > z
    ? null
    : { [tileInfo.sourceLayer]: tiles.getTile(z, x, y) };
};

export default getTiles;
