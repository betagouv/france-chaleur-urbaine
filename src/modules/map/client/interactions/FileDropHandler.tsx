import { bbox } from '@turf/bbox';
import type maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';

import { convertLambert93GeoJSONToWGS84, hasLambert93Projection } from '@/modules/geo/client/helpers';
import { toastErrors } from '@/modules/notification';

import { useMapInstance } from '../core/MapCanvasContext';
import { convertFileToGeoJSON, readShapefileWithProjection } from './fileConversion';

type FileDropHandlerProps = {
  /** Called with the parsed GeoJSON after a successful drop or paste. */
  onDrop?: (geojson: any) => void;
  /** ID of the GeoJSON source receiving the dropped feature collection (default: `customGeojson`). */
  sourceId?: string;
};

/**
 * V2 equivalent of `src/components/Map/components/FileDragNDrop.tsx` — adds a
 * drag/drop + paste overlay on the canvas and pushes the parsed GeoJSON to a
 * map source (and the optional `onDrop` callback).
 */
export function FileDropHandler({ onDrop, sourceId = 'customGeojson' }: FileDropHandlerProps) {
  const map = useMapInstance();
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const container = map.getContainer();

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    };
    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
    };

    const updateSource = (geojson: any) => {
      onDrop?.(geojson);
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (!source) {
        throw new Error(`Source ${sourceId} not found`);
      }
      source.setData(geojson);
      map.fitBounds(bbox(geojson) as [number, number, number, number], { duration: 3000, maxZoom: 17 });
    };

    const handleDrop = toastErrors(async (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const wgs84GeoJsonData = Array.from(files).some((f) => f.name.endsWith('.shp'))
        ? await readShapefileWithProjection(Array.from(files))
        : await convertFileToGeoJSON(files[0]);
      updateSource(wgs84GeoJsonData);
    });

    const handlePaste = toastErrors(async (event: ClipboardEvent) => {
      event.preventDefault();
      const text = event.clipboardData?.getData('text');
      if (!text) return;
      let geojsonData;
      try {
        geojsonData = JSON.parse(text);
      } catch {
        throw new Error("Le contenu collé n'est pas un GeoJSON valide");
      }
      const wgs84GeoJsonData = hasLambert93Projection(geojsonData) ? await convertLambert93GeoJSONToWGS84(geojsonData) : geojsonData;
      updateSource(wgs84GeoJsonData);
    });

    container.addEventListener('dragover', onDragOver);
    container.addEventListener('dragleave', onDragLeave);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('paste', handlePaste);

    return () => {
      container.removeEventListener('dragover', onDragOver);
      container.removeEventListener('dragleave', onDragLeave);
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('paste', handlePaste);
    };
  }, [map, onDrop, sourceId]);

  return (
    <div
      aria-hidden={!dragging}
      className={`pointer-events-none absolute inset-0 m-12 grid place-content-center border-4 border-dashed border-black bg-black/30 text-xl font-bold transition-opacity duration-300 ${dragging ? 'opacity-100' : 'opacity-0'}`}
    >
      Glissez et déposez votre fichier GeoJSON ici
    </div>
  );
}
