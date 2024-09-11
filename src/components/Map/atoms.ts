import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { atom } from 'jotai';
import { MapRef } from 'react-map-gl/maplibre';

export const mapRefAtom = atom<MapRef | null>(null);
export const mapDrawAtom = atom<MapboxDraw | null>(null);
