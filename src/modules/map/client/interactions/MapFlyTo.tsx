import { useEffect } from 'react';

import type { LngLat } from '../../shared/types';
import { useMapInstance, useMapReady } from '../core/MapCanvasContext';

type MapFlyToProps = {
  /** Target center `[lng, lat]`. `undefined` is a no-op. */
  center?: LngLat;
  /** Target zoom (default: keep current). */
  zoom?: number;
  /** Animation duration in ms (default 1000). */
  duration?: number;
};

/**
 * Declarative `flyTo`, driven by a center/zoom. Gated on `mapReady`; `essential: true`
 * so the move survives `prefers-reduced-motion`. Re-flies when the center/zoom change.
 * The initial camera position is the map's `initialView` job — set `initialView` to the
 * first target so the mount fly is a no-op (you're already there).
 */
export function MapFlyTo({ center, zoom, duration = 1000 }: MapFlyToProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();

  const [lng, lat] = center ?? [];
  useEffect(() => {
    if (!mapReady || !center) {
      return;
    }
    map.flyTo({ center, duration, essential: true, zoom });
  }, [map, mapReady, lng, lat, zoom, duration]);

  return null;
}
