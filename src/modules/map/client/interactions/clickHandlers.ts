import type { Position } from 'geojson';
import { atom, type PrimitiveAtom, useSetAtom } from 'jotai';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { type RefObject, useEffect, useRef } from 'react';

/**
 * Two click primitives, both honored by the single `MapInteractions` handler. Keep it to **two** —
 * don't add a hook per caller, and don't build a per-layer priority system.
 *
 * - `useMapFeatureClick(source, cb)` — react to a click on a **base** interactive layer (its popup
 *   still opens). A passive listener, not an exclusive mode.
 * - `useMapClickCapture(active)` — while active, **pause base interactions** (no popup/hover), like
 *   the drawing tools' mode. For a tool that owns the click (e.g. the building selector): it keeps
 *   its own layer-scoped `map.on('click', …)` and calls this so nothing else reacts meanwhile.
 */

export type FeatureClickSubscriber = {
  /** Source id whose feature clicks to receive. */
  source: string;
  onClick: (feature: MapGeoJSONFeature, snapPoint: Position) => void;
};

// Holds refs (stable identity) so registering never re-attaches the MapInteractions listener,
// and the latest callback is always read via `ref.current`.
export const featureClickSubscribersAtom = atom<RefObject<FeatureClickSubscriber>[]>([]);

// Ref-counted: base interactions are paused while > 0 (several tools may capture at once).
export const mapClickCaptureCountAtom = atom(0);

function useRegisterRef<T>(registryAtom: PrimitiveAtom<RefObject<T>[]>, value: T) {
  const ref = useRef(value);
  ref.current = value;
  const setRegistry = useSetAtom(registryAtom);
  useEffect(() => {
    setRegistry((prev) => [...prev, ref]);
    return () => setRegistry((prev) => prev.filter((entry) => entry !== ref));
  }, [setRegistry]);
}

/** Receive clicks on a base interactive layer by `source`, alongside its popup. */
export function useMapFeatureClick(source: string, onClick: FeatureClickSubscriber['onClick']) {
  useRegisterRef(featureClickSubscribersAtom, { onClick, source });
}

/** While `active`, pause base map interactions (clicks/popups/hover) — for a tool that owns the click. */
export function useMapClickCapture(active: boolean) {
  const setCount = useSetAtom(mapClickCaptureCountAtom);
  useEffect(() => {
    if (!active) {
      return;
    }
    setCount((count) => count + 1);
    return () => setCount((count) => count - 1);
  }, [active, setCount]);
}
