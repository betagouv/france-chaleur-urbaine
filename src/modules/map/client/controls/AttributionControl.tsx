import { AttributionControl as MaplibreAttributionControl } from 'maplibre-gl';
import { useEffect } from 'react';

import { useMapInstance } from '../core/MapCanvasContext';
import { useControl } from './useControl';

const FCU_ATTRIBUTION = '<a href="/donnees" target="_blank" rel="noopener noreferrer">France Chaleur Urbaine</a>';

/**
 * Attribution credits, bottom-right. Always mounted for license compliance.
 * No `compact` option → MapLibre auto mode: full when wide (> 640px), "ⓘ" icon when narrow.
 */
export function AttributionControl() {
  const map = useMapInstance();
  useControl(() => new MaplibreAttributionControl({ customAttribution: FCU_ATTRIBUTION }), 'bottom-right');

  // Narrow maps start expanded (MapLibre minimizes only on first drag) — collapse upfront.
  // No-op when wide; never re-added once `maplibregl-compact` is set.
  useEffect(() => {
    map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
  }, [map]);

  return null;
}
