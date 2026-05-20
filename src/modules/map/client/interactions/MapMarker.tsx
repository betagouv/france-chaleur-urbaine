import { Marker, type PositionAnchor } from 'maplibre-gl';
import { useEffect, useRef } from 'react';

import { useMapInstance } from '../core/MapCanvasContext';

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  /** CSS color string (defaults to MapLibre's blue). */
  color?: string;
  /** Anchor of the marker relative to the lng/lat. Defaults to `'center'`. */
  anchor?: PositionAnchor;
};

/**
 * Mounts a `maplibregl.Marker` (HTML overlay) on the parent `<Map>` at the
 * given lng/lat. Mount/unmount manages the marker lifecycle; lng/lat updates
 * are applied imperatively via `setLngLat` (no re-mount).
 *
 * Render as a child of `<Map>` — the `useMapInstance()` hook needs the
 * `MapCanvasContext` provided by `<MapCanvas>` (which `<Map>` wraps).
 */
export function MapMarker({ longitude, latitude, color, anchor }: MapMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Mount/unmount the underlying marker. Color & anchor are mount-only props
  // because MapLibre doesn't expose setters for them.
  useEffect(() => {
    const marker = new Marker({ anchor, color }).setLngLat([longitude, latitude]).addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, color, anchor]);

  // Apply lng/lat changes without re-creating the marker.
  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  return null;
}
