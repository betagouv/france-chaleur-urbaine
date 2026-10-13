import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect, useRef } from 'react';

import { useMapInstance, useMapReady } from '../core/MapCanvasContext';
import { useMapClickCapture } from './clickHandlers';

type MapPointPickerProps = {
  /** While `true`: crosshair cursor, every click on the map picks a point, base interactions (popups, hover) paused. */
  active: boolean;
  /** Called with the clicked position (WGS84) at each click. */
  onPick: (point: GeoJSON.Point) => void;
};

/**
 * Lets the user place a point on the map by clicking (e.g. the position of a network known without trace).
 * Owns the click through `useMapClickCapture`: nothing else reacts to it while active.
 */
export function MapPointPicker({ active, onPick }: MapPointPickerProps) {
  const map = useMapInstance();
  const mapReady = useMapReady();
  useMapClickCapture(active);
  // the latest callback is read at click time: the listener is not re-attached on each render
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!mapReady || !active) {
      return;
    }
    const canvas = map.getCanvas();
    // a class, not an inline style: `MapInteractions` resets `style.cursor` when the capture starts
    canvas.classList.add('cursor-crosshair');
    const onClick = (event: MapMouseEvent) => {
      onPickRef.current({ coordinates: [event.lngLat.lng, event.lngLat.lat], type: 'Point' });
    };
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
      canvas.classList.remove('cursor-crosshair');
    };
  }, [map, mapReady, active]);

  return null;
}
