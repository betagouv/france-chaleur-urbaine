import { type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire } from './filters';

export const reseauxEnConstructionColor = '#DA5DD5';
export const reseauxEnConstructionOpacity = 0.47;

export const reseauxEnConstructionLayersSpec = [
  {
    sourceId: 'futurNetwork',
    source: {
      type: 'vector',
      tiles: ['/api/map/futurNetwork/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxEnConstruction-zone',
        'source-layer': 'futurOutline',
        type: 'fill',
        paint: {
          'fill-color': reseauxEnConstructionColor,
          'fill-opacity': reseauxEnConstructionOpacity,
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], true], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
      },
      {
        id: 'reseauxEnConstruction-trace',
        'source-layer': 'futurOutline',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': reseauxEnConstructionColor,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 2],
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], false], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
