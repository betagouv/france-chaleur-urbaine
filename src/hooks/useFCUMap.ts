import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { atom, useAtom, useSetAtom } from 'jotai';
import { MapRef } from 'react-map-gl/maplibre';

import { isDefined } from '@utils/core';

export const mapRefAtom = atom<MapRef | null>(null);
export const mapDrawAtom = atom<MapboxDraw | null>(null);
export const isDrawingAtom = atom<boolean>(false);

type UseFCUMapResult = {
  setMapRef: ReturnType<typeof useSetAtom<typeof mapRefAtom>>;
  setMapDraw: ReturnType<typeof useSetAtom<typeof mapDrawAtom>>;
  setIsDrawing: ReturnType<typeof useSetAtom<typeof isDrawingAtom>>;
} & (
  | { mapLoaded: false; mapRef: null; mapDraw: null; isDrawing: false }
  | {
      mapLoaded: true;
      mapRef: MapRef;
      mapDraw: MapboxDraw;
      isDrawing: boolean;
    }
);

/**
 * This hooks waits for the map to be initialized before returning non-null values.
 */
const useFCUMap = (): UseFCUMapResult => {
  const [mapRef, setMapRef] = useAtom(mapRefAtom);
  const [mapDraw, setMapDraw] = useAtom(mapDrawAtom);
  const [isDrawing, setIsDrawing] = useAtom(isDrawingAtom);

  if (!isDefined(mapRef) || !isDefined(mapDraw)) {
    return { mapLoaded: false, mapRef: null, mapDraw: null, isDrawing: false, setMapRef, setMapDraw, setIsDrawing };
  }
  return { mapLoaded: true, mapRef, mapDraw, isDrawing, setMapRef, setMapDraw, setIsDrawing };
};

export default useFCUMap;
