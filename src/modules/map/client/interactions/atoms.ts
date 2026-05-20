import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { atom } from 'jotai';
import type maplibregl from 'maplibre-gl';

/** Map atoms scoped per-`<Map>` via `<MapStoreProvider>`. */

export const mapInstanceAtom = atom<maplibregl.Map | null>(null);
export const mapReadyAtom = atom(false);
export const mapDrawAtom = atom<MapboxDraw | null>(null);

/** `<MapInteractions>` pauses its handlers while this is `true`. */
export const isDrawingAtom = atom(false);
