import type { ControlPosition, IControl } from 'maplibre-gl';
import { useEffect } from 'react';

import { useMapInstance } from '../core/MapCanvasContext';

/**
 * Adds a MapLibre `IControl` to the parent `<MapCanvas>` for the component lifetime.
 *
 * Pass a stable factory (memoized or module-level) so the control is created once.
 * Position changes recreate the control because MapLibre doesn't support live-moving controls.
 */
export function useControl(factory: () => IControl, position?: ControlPosition) {
  const map = useMapInstance();
  useEffect(() => {
    const control = factory();
    map.addControl(control, position);
    return () => {
      map.removeControl(control);
    };
    // factory is intentionally not in deps — callers pass an inline closure that captures their props.
  }, [map, position]);
}
