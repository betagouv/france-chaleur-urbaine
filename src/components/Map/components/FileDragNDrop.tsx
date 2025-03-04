import { bbox } from '@turf/bbox';
import { useEffect, useState } from 'react';

import useFCUMap from '@/components/Map/MapProvider';
import Box from '@/components/ui/Box';
import { convertLambert93GeoJSONToWGS84, hasLambert93Projection } from '@/utils/geo';

const FileDragNDrop = () => {
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

    const onDrop = async (event: DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      setDragging(false);
      if (!file) {
        return;
      }

      const wgs84GeoJsonData = await convertFileToGeoJSON(file);
      console.info('converted file', wgs84GeoJsonData);
      if (!mapRef?.getSource('customGeojson')) {
        throw new Error('Source customGeojson not found');
      }
      (mapRef.getSource('customGeojson') as maplibregl.GeoJSONSource).setData(wgs84GeoJsonData);
      mapRef.fitBounds(bbox(wgs84GeoJsonData) as [number, number, number, number], { maxZoom: 17, duration: 3000 });
    };

    mapRef.getContainer().addEventListener('dragover', onDragOver);
    mapRef.getContainer().addEventListener('dragleave', onDragLeave);
    mapRef.getContainer().addEventListener('drop', onDrop);
    return () => {
      mapRef.getContainer().removeEventListener('dragover', onDragOver);
      mapRef.getContainer().removeEventListener('dragleave', onDragLeave);
      mapRef.getContainer().removeEventListener('drop', onDrop);
    };
  }, [mapRef]);

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
  {
    extensions: ['kml'],
    async convert(file) {
      const text = await file.text();
      const kml = new DOMParser().parseFromString(text, 'text/xml');
      return (await import('@tmcw/togeojson')).kml(kml);
    },
  },
  {
    extensions: ['kmz'],
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
  },
  {
    extensions: ['zip'], // = zipped shp
    async convert(file) {
      const zip = await file.arrayBuffer();
      const zipData = await (await import('jszip')).default.loadAsync(zip);
      const shpFile = Object.values(zipData.files).find((f) => f.name.endsWith('.shp'));
      if (shpFile) {
        const shpBuffer = await shpFile.async('arraybuffer');
        const source = await (await import('shapefile')).open(shpBuffer);
        const result = await source.read();
        return result.value;
      }
    },
  },
  {
    extensions: ['shp'],
    async convert(file) {
      const content = await file.arrayBuffer();
      const source = await (await import('shapefile')).open(content);
      const result = await source.read();
      return result.value;
    },
  },
  {
    extensions: ['json', 'geojson'],
    async convert(file) {
      const geoJsonData = JSON.parse(await file.text());
      return hasLambert93Projection(geoJsonData) ? await convertLambert93GeoJSONToWGS84(geoJsonData) : geoJsonData;
    },
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
