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

    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      setDragging(false);

      if (file && (file.type === 'application/geo+json' || file.type === 'application/json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const geoJsonData = JSON.parse(e.target?.result as string);
            const wgs84GeoJsonData = hasLambert93Projection(geoJsonData) ? convertLambert93GeoJSONToWGS84(geoJsonData) : geoJsonData;

            if (!mapRef?.getSource('customGeojson')) {
              throw new Error('Source customGeojson not found');
            }
            (mapRef.getSource('customGeojson') as maplibregl.GeoJSONSource).setData(wgs84GeoJsonData);
            mapRef.fitBounds(bbox(wgs84GeoJsonData) as [number, number, number, number], { maxZoom: 17 });
          } catch (error) {
            console.error('Invalid GeoJSON', error);
          }
        };
        reader.readAsText(file);
      }
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
