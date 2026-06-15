import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { useMapInstance, useMapReady } from '../core/MapCanvasContext';
import { mapInstanceAtom, mapReadyAtom } from './atoms';

/** Bridges `MapCanvasContext` into atoms readable from outside the canvas subtree. */
export function MapInstanceSync() {
  const map = useMapInstance();
  const ready = useMapReady();
  const setMap = useSetAtom(mapInstanceAtom);
  const setReady = useSetAtom(mapReadyAtom);
  useEffect(() => {
    setMap(map);
    return () => setMap(null);
  }, [map, setMap]);
  useEffect(() => {
    setReady(ready);
    return () => setReady(false);
  }, [ready, setReady]);
  return null;
}
