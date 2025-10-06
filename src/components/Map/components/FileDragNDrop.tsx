import { bbox } from '@turf/bbox';
import { useEffect, useState } from 'react';

import useFCUMap from '@/components/Map/MapProvider';
import Box from '@/components/ui/Box';
import { toastErrors } from '@/modules/notification';
import { convertLambert93GeoJSONToWGS84, hasLambert93Projection } from '@/utils/geo';

export type FileDragNDropProps = {
  onDrop?: (geojson: any) => void;
};

/**
 * A component that allows the user to drag and drop a geographic file to the map.
 */
const FileDragNDrop = ({ onDrop }: FileDragNDropProps) => {
  const { mapRef } = useFCUMap();
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!mapRef) {
      return;
    }
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    };
    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
    };

    const handleDrop = toastErrors(async (event: DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer?.files;
      setDragging(false);
      if (!files || files.length === 0) {
        return;
      }
      const wgs84GeoJsonData = Array.from(files).some((f) => f.name.endsWith('.shp'))
        ? await readShapefileWithProjection(Array.from(files))
        : await convertFileToGeoJSON(files[0]);

      // Call the provided onDrop callback if available
      if (onDrop) {
        onDrop(wgs84GeoJsonData);
      }

      if (!mapRef?.getSource('customGeojson')) {
        throw new Error('Source customGeojson not found');
      }
      (mapRef.getSource('customGeojson') as maplibregl.GeoJSONSource).setData(wgs84GeoJsonData);
      mapRef.fitBounds(bbox(wgs84GeoJsonData) as [number, number, number, number], { duration: 3000, maxZoom: 17 });
    });

    mapRef.getContainer().addEventListener('dragover', onDragOver);
    mapRef.getContainer().addEventListener('dragleave', onDragLeave);
    mapRef.getContainer().addEventListener('drop', handleDrop);
    return () => {
      mapRef.getContainer().removeEventListener('dragover', onDragOver);
      mapRef.getContainer().removeEventListener('dragleave', onDragLeave);
      mapRef.getContainer().removeEventListener('drop', handleDrop);
    };
  }, [mapRef, onDrop]);

  return (
    <Box
      className={`absolute top-0 left-0 right-0 bottom-0 fr-m-6w border-4 border-dashed border-black bg-black/30 grid place-content-center text-xl font-bold pointer-events-none transition-opacity duration-300 ${
        dragging ? 'opacity-100' : 'opacity-0'
      }`}
    >
      Glissez et déposez votre fichier GeoJSON ici
    </Box>
  );
};

export default FileDragNDrop;

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

async function convertFileToGeoJSON(file: File) {
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
async function readShapefileWithProjection(files: File[]) {
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
