import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { atom, useAtom, useSetAtom } from 'jotai';
import { MapRef } from 'react-map-gl/maplibre';

import { isDefined } from '@utils/core';

export const mapRefAtom = atom<MapRef | null>(null);
export const mapDrawAtom = atom<MapboxDraw | null>(null);

type UseFCUMapResult = {
  setMapRef: ReturnType<typeof useSetAtom<typeof mapRefAtom>>;
  setMapDraw: ReturnType<typeof useSetAtom<typeof mapDrawAtom>>;
} & (
  | { mapLoaded: false; mapRef: null; mapDraw: null }
  | {
      mapLoaded: true;
      mapRef: MapRef;
      mapDraw: MapboxDraw;
    }
);

/**
 * This hooks waits for the map to be initialized before returning non-null values.
 */
const useFCUMap = (): UseFCUMapResult => {
  const [mapRef, setMapRef] = useAtom(mapRefAtom);
  const [mapDraw, setMapDraw] = useAtom(mapDrawAtom);

  if (!isDefined(mapRef) || !isDefined(mapDraw)) {
    return { mapLoaded: false, mapRef: null, mapDraw: null, setMapRef, setMapDraw };
  }
  return { mapLoaded: true, mapRef, mapDraw, setMapRef, setMapDraw };
};

export default useFCUMap;
