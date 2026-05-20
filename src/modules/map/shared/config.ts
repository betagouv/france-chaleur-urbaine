import type { StyleSpecification } from 'maplibre-gl';

import rawOsmStyle from '@/components/Map/osm.config.json';
import rawSatelliteStyle from '@/components/Map/satellite.config.json';

import type { LngLat } from './types';

// Default view roughly centered on metropolitan France.
export const defaultCenter: LngLat = [2.3, 47];
export const defaultZoom = 5;
export const defaultMinZoom = 5;
export const defaultMaxZoom = 20;

// JSON imports lose tuple types — cast once at this boundary so callers stay type-safe.
// Style files are temporarily reused from the V1 location while V1 and V2 coexist
// (moved into this module at cleanup, step 14 of `.ai/plans/map-v2.md`).
export const osmStyle = rawOsmStyle as unknown as StyleSpecification;
export const satelliteStyle = rawSatelliteStyle as unknown as StyleSpecification;

export type MapStyle = { id: string; label: string; spec: StyleSpecification };

export const defaultStyles: MapStyle[] = [
  { id: 'osm', label: 'Carte', spec: osmStyle },
  { id: 'satellite', label: 'Satellite', spec: satelliteStyle },
];
