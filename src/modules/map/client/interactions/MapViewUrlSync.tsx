import { useDebouncedCallback } from '@react-hookz/web';
import { parseAsString, useQueryStates } from 'nuqs';
import { useEffect } from 'react';

import { useMapInstance } from '../core/MapCanvasContext';

/**
 * Persists the map view into the URL on move: writes `?coord=lng,lat&zoom=` and
 * clears any one-shot `?bounds=`. The initial view is read from the URL by the
 * host page (mount-only `initialView`). Mount as a child of `<MapCanvas>` / `<Map>`.
 */
export function MapViewUrlSync() {
  const map = useMapInstance();
  const [, setQuery] = useQueryStates({ bounds: parseAsString, coord: parseAsString, zoom: parseAsString });

  const syncViewToUrl = useDebouncedCallback(
    () => {
      const center = map.getCenter();
      void setQuery(
        { bounds: null, coord: `${center.lng.toFixed(7)},${center.lat.toFixed(7)}`, zoom: map.getZoom().toFixed(2) },
        { history: 'replace' }
      );
    },
    [map, setQuery],
    500
  );

  useEffect(() => {
    map.on('moveend', syncViewToUrl);
    return () => {
      map.off('moveend', syncViewToUrl);
    };
  }, [map, syncViewToUrl]);

  return null;
}
