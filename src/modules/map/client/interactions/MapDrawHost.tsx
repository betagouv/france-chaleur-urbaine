import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useSetAtom } from 'jotai';
import type * as maplibregl from 'maplibre-gl';
import { useEffect } from 'react';

import { useMapInstance } from '../core/MapCanvasContext';
import { mapDrawAtom } from './atoms';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

/**
 * maplibre-gl v6 types `Map.on/off` against its own event map, so the custom
 * `draw.*` events fired by MapboxDraw need this typed escape hatch.
 * Returns the unsubscribe function.
 */
export function onDrawEvent<K extends keyof MapboxDraw.DrawEvents>(
  map: maplibregl.Map,
  type: K,
  listener: (event: MapboxDraw.DrawEvents[K]) => void
): () => void {
  const evented = map as unknown as {
    on(type: string, listener: (event: never) => void): unknown;
    off(type: string, listener: (event: never) => void): unknown;
  };
  evented.on(type, listener);
  return () => evented.off(type, listener);
}

/**
 * Attaches a `MapboxDraw` control to the canvas and exposes it via `mapDrawAtom`.
 * All built-in draw styles are disabled — every shape is rendered by the layer
 * specs in `layers/specs/tools/`, driven by Jotai atoms inside each tool.
 */
export function MapDrawHost() {
  const map = useMapInstance();
  const setDraw = useSetAtom(mapDrawAtom);

  useEffect(() => {
    const instance = new MapboxDraw({
      displayControlsDefault: false,
      styles: [{ id: 'draw-empty-layer', paint: { 'background-opacity': 0 }, type: 'background' }],
    });
    map.addControl(instance as unknown as maplibregl.IControl);
    setDraw(instance);
    return () => {
      setDraw(null);
      // Defer `removeControl`: it nullifies MapboxDraw's internals sync, which
      // would zombify the `draw` ref still held by sibling tool cleanups.
      setTimeout(() => {
        try {
          map.removeControl(instance as unknown as maplibregl.IControl);
        } catch {
          // Map already removed by MapCanvas deferred cleanup.
        }
      }, 0);
    };
  }, [map, setDraw]);

  return null;
}
