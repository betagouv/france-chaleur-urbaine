import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useSetAtom } from 'jotai';
import type maplibregl from 'maplibre-gl';
import { useEffect } from 'react';

import { useMapInstance } from '../core/MapCanvasContext';
import { mapDrawAtom } from './atoms';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

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
      map.removeControl(instance as unknown as maplibregl.IControl);
      setDraw(null);
    };
  }, [map, setDraw]);

  return null;
}
