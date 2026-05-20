import { NavigationControl as MaplibreNavigationControl } from 'maplibre-gl';

import { useControl } from './useControl';

/**
 * Zoom in/out, compass, and pitch indicator. Wraps MapLibre's native control.
 */
export function NavigationControl() {
  useControl(() => new MaplibreNavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'bottom-right');
  return null;
}
