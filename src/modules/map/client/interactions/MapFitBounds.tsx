import { useEffect } from 'react';

import type { BBox } from '../../shared/types';
import { useMapInstance, useMapReady } from '../core/MapCanvasContext';

type MapFitBoundsProps = {
  /** Bounds to fit. `undefined` is a no-op (keeps the current view). */
  bbox?: BBox;
  /** Viewport padding in px (default 40). */
  padding?: number;
  /** Cap the resulting zoom (default: no cap). */
  maxZoom?: number;
  /** Animation duration in ms (default 1000). */
  duration?: number;
};

/**
 * Declarative `fitBounds` driven by a bbox. Gated on `mapReady`; `essential: true` so the move
 * survives `prefers-reduced-motion`. Reacts to bbox *value* changes only — the initial camera
 * position is `initialView`'s job.
 *
 * `maxZoom` is omitted from the options when undefined: MapLibre's `extend` copies an explicit
 * `maxZoom: undefined`, clobbering its own default and yielding a NaN zoom (→ crash). Let the
 * default apply by leaving the key out entirely.
 */
export function MapFitBounds({ bbox, padding = 40, maxZoom, duration = 1000 }: MapFitBoundsProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();

  const [west, south, east, north] = bbox ?? [];
  useEffect(() => {
    if (!mapReady || !bbox) {
      return;
    }
    map.fitBounds(bbox, { duration, essential: true, padding, ...(maxZoom !== undefined && { maxZoom }) });
  }, [map, mapReady, west, south, east, north, padding, maxZoom, duration]);

  return null;
}
