import { GeolocateControl as MaplibreGeolocateControl } from 'maplibre-gl';

import { useControl } from './useControl';

/**
 * Geolocation button. Centers the map on the user's location and keeps tracking it.
 */
export function GeolocateControl() {
  useControl(
    () =>
      new MaplibreGeolocateControl({
        fitBoundsOptions: { maxZoom: 13 },
        trackUserLocation: true,
      }),
    'bottom-right'
  );
  return null;
}
