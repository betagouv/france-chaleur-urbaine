import { convertLambert93GeoJSONToWGS84, hasLambert93Projection } from '@/modules/geo/client/helpers';

type FileConversionStrategy = {
  extensions: string[];
  convert: (file: File) => Promise<any>;
};

const fileConversionStrategy = [
  // manque fichiers gpkg (= base sqlite), mais pas réussi à importer le module qui avait besoin de 'fs'
  {
    async convert(file) {
      const text = await file.text();
      const kml = new DOMParser().parseFromString(text, 'text/xml');
      return (await import('@tmcw/togeojson')).kml(kml);
    },
    extensions: ['kml'],
  },
  {
    async convert(file) {
      const zip = await file.arrayBuffer();
      const zipData = await (await import('jszip')).default.loadAsync(zip);
      const kmlFile = Object.values(zipData.files).find((f) => f.name.endsWith('.kml'));
      if (kmlFile) {
        const kmlText = await kmlFile.async('text');
        const kml = new DOMParser().parseFromString(kmlText, 'text/xml');
        return (await import('@tmcw/togeojson')).kml(kml);
      }
    },
    extensions: ['kmz'],
  },
  {
    async convert(file) {
      const geoJsonData = JSON.parse(await file.text());
      return hasLambert93Projection(geoJsonData) ? await convertLambert93GeoJSONToWGS84(geoJsonData) : geoJsonData;
    },
    extensions: ['json', 'geojson'],
  },
] satisfies FileConversionStrategy[];

export async function convertFileToGeoJSON(file: File) {
  const fileExtension = file.name.split('.').pop()?.toLowerCase() as string;
  const strategy = fileConversionStrategy.find((strategy) => strategy.extensions.includes(fileExtension));
  if (!strategy) {
    throw new Error('Format non pris en charge');
  }
  return strategy.convert(file);
}

/**
 * Reads a shapefile (.shp) with its projection (.prj) and its optional attributes (.dbf).
 * @param files files to read
 * @returns a geojson with the coordinates in WGS84
 */
export async function readShapefileWithProjection(files: File[]) {
  const fileMap = new Map(files.map((file) => [file.name.split('.').pop(), file]));
  if (!fileMap.has('shp') || !fileMap.has('prj')) {
    throw new Error('Un Shapefile doit contenir des fichiers .shp et .prj');
  }

  const [shp, prj, dbf] = await Promise.all(['shp', 'prj', 'dbf'].map((ext) => fileMap.get(ext)?.arrayBuffer()));

  const source = await (await import('shapefile')).open(shp!, dbf);
  const features = [];
  let result = await source.read();
  while (!result.done) {
    features.push(result.value);
    result = await source.read();
  }

  const geojson = { features, type: 'FeatureCollection' };
  const sourceCrs = prj ? await detectCrsFromProj(new TextDecoder().decode(prj)) : undefined;
  return convertToWGS84(geojson, sourceCrs);
}

/**
 * Detect the CRS from a .prj file using proj4.
 * @param projText content of the .prj file
 * @returns the CRS
 */
async function detectCrsFromProj(projText: string) {
  try {
    const proj4 = (await import('proj4')).default;
    return (proj4(projText) as any).oProj;
  } catch (_error) {
    console.warn("Impossible d'analyser le .prj, utilisation de EPSG:4326");
    return undefined;
  }
}

/**
 * Convert the coordinates of a geojson to WGS84.
 * @param geojson
 * @param sourceCrs
 * @returns a geojson with the coordinates in WGS84
 */
async function convertToWGS84(geojson: any, sourceCrs?: any) {
  if (!sourceCrs) return geojson;

  const proj4 = (await import('proj4')).default;

  proj4.defs([
    ['EPSG:4326', proj4.WGS84],
    ['source-srid', sourceCrs],
  ]);

  function transformCoords(coords: any) {
    if (Array.isArray(coords[0])) {
      return coords.map(transformCoords);
    }
    return proj4('source-srid', 'EPSG:4326', coords);
  }

  geojson.features.forEach((feature: any) => {
    feature.geometry.coordinates = transformCoords(feature.geometry.coordinates);
  });

  return geojson;
}
