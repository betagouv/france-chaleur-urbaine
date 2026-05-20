import { AttributionControl as MaplibreAttributionControl } from 'maplibre-gl';

import { useControl } from './useControl';

const FCU_ATTRIBUTION = '<a href="/donnees" target="_blank" rel="noopener noreferrer">Sources</a>';

/**
 * Attribution credits, anchored bottom-right. Always mounted by `<MapCanvas>`
 * (even when `interactive=false`) for license compliance.
 *
 * `compact: true` collapses the attributions into a small "ⓘ" icon that
 * expands on click — keeps the map clean and avoids overlap with overlays.
 */
export function AttributionControl() {
  useControl(() => new MaplibreAttributionControl({ compact: true, customAttribution: FCU_ATTRIBUTION }), 'bottom-right');
  return null;
}
