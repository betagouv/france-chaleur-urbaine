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

/** `maplibregl.Marker` overlay. Must be rendered as a child of `<MapCanvas>`. */
export function MapMarker({ longitude, latitude, color, anchor }: MapMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Color & anchor are mount-only — MapLibre doesn't expose setters.
  useEffect(() => {
    const marker = new Marker({ anchor, color }).setLngLat([longitude, latitude]).addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, color, anchor]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  return null;
}
