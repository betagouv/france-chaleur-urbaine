import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';

import type { MapConfiguration, MapConfigurationProperty } from '../../config/map-configuration';
import { useMapConfig } from '../../config/useMapConfig';
import { isDrawingAtom, mapDrawAtom, mapInstanceAtom, mapReadyAtom } from '../../interactions/atoms';

type ToolVisibilityFlag = Extract<keyof MapConfiguration, 'mesureDistance' | 'extractionDonneesBatiment' | 'densiteThermiqueLineaire'>;

export type DrawMode = 'draw_line_string' | 'simple_select' | 'draw_polygon';

// `@types/mapbox__mapbox-gl-draw` ships per-mode `changeMode` overloads that
// reject any string union — we re-type it through a single permissive overload.
type WrappedDraw = Omit<MapboxDraw, 'changeMode'> & {
  changeMode(mode: DrawMode, options?: object): MapboxDraw;
};

/**
 * Shared plumbing for the drawing tools. Toggles the visibility flag for the
 * tool's render layers, exposes the map / draw references, and applies a
 * crosshair cursor while a sketch is in progress.
 *
 * On unmount, the draw control is forced back to `simple_select` so stray
 * clicks (anywhere on the map) don't keep adding vertices after the user has
 * navigated away from the tool.
 */
export function useDrawingTool(visibilityFlag: ToolVisibilityFlag) {
  const map = useAtomValue(mapInstanceAtom);
  const rawDraw = useAtomValue(mapDrawAtom);
  const mapReady = useAtomValue(mapReadyAtom);
  const [isDrawing, setIsDrawing] = useAtom(isDrawingAtom);
  const { updateProperty } = useMapConfig();

  const draw = useMemo(() => (rawDraw ? (rawDraw as unknown as WrappedDraw) : null), [rawDraw]);

  useEffect(() => {
    updateProperty(visibilityFlag as MapConfigurationProperty<boolean>, true);
    return () => {
      setIsDrawing(false);
      draw?.changeMode('simple_select');
    };
    // Flag intentionally kept `true` on unmount so previously-drawn shapes stay
    // visible after closing the tool, until the host `<Map>` itself unmounts.
  }, [draw, setIsDrawing, updateProperty, visibilityFlag]);

  // mapbox-gl-draw writes `style.cursor` on the canvas inline — only an inline
  // style on the same element overrides it.
  useEffect(() => {
    if (!map || !isDrawing) return;
    const canvas = map.getCanvas();
    const previous = canvas.style.cursor;
    canvas.style.cursor = 'crosshair';
    return () => {
      canvas.style.cursor = previous;
    };
  }, [map, isDrawing]);

  return { draw, isDrawing, map, mapReady, setIsDrawing };
}
