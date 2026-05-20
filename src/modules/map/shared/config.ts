import type { StyleSpecification } from 'maplibre-gl';

import rawOsmStyle from './osm.config.json';
import rawSatelliteStyle from './satellite.config.json';
import type { LngLat } from './types';

// Default view roughly centered on metropolitan France.
export const defaultCenter: LngLat = [2.3, 47];
export const defaultZoom = 5;
export const defaultMinZoom = 5;
export const defaultMaxZoom = 20;

// JSON imports lose tuple types — cast once at this boundary so callers stay type-safe.
export const osmStyle = rawOsmStyle as unknown as StyleSpecification;
export const satelliteStyle = rawSatelliteStyle as unknown as StyleSpecification;

export type MapStyle = { id: string; label: string; spec: StyleSpecification };

export const defaultStyles: MapStyle[] = [
  { id: 'osm', label: 'Carte', spec: osmStyle },
  { id: 'satellite', label: 'Satellite', spec: satelliteStyle },
];
