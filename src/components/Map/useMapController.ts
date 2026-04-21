import type { FitBoundsOptions, Map as MapLibreMap } from 'maplibre-gl';
import { type RefObject, useCallback, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';

import type { BoundingBox } from '@/modules/geo/types';

const defaultFitOptions: FitBoundsOptions = { duration: 1000, padding: 50 };

export type MapController = {
  /** Pass to the `mapRef` prop of the map component. */
  mapRef: RefObject<MapRef | null>;
  /** Fit the map view to the given bounding box. No-op if the map isn't mounted yet. */
  fitBounds: (bounds: BoundingBox, options?: FitBoundsOptions) => void;
  /** Underlying MapLibre instance (escape hatch). Undefined until the map is mounted. */
  getMap: () => MapLibreMap | undefined;
};

/**
 * Creates an imperative controller for a map component.
 *
 * Usage:
 *   const { mapRef, fitBounds } = useMapController();
 *   <FCUMap mapRef={mapRef} ... />
 *   // later: fitBounds([w, s, e, n]);
 */
export const useMapController = (): MapController => {
  const mapRef = useRef<MapRef>(null);

  const getMap = useCallback(() => mapRef.current?.getMap(), []);

  const fitBounds = useCallback<MapController['fitBounds']>((bounds, options) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.fitBounds(bounds, { ...defaultFitOptions, ...options });
  }, []);

  return { fitBounds, getMap, mapRef };
};
