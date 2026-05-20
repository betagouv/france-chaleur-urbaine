import { ScaleControl as MaplibreScaleControl } from 'maplibre-gl';

import { useControl } from './useControl';

/**
 * Metric scale bar at bottom-left.
 */
export function ScaleControl() {
  useControl(() => new MaplibreScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
  return null;
}
