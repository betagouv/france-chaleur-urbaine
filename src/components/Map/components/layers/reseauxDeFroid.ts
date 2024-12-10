import { type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire, buildFiltreIdentifiantReseau } from './filters';

export const reseauxDeFroidColor = '#0094FF';

export const reseauxDeFroidLayersSpec = [
  {
    sourceId: 'coldNetwork',
    source: {
      type: 'vector',
      tiles: ['/api/map/coldNetwork/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxDeFroid-avec-trace',
        'source-layer': 'coldOutline',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': reseauxDeFroidColor,
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 2],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeFroid,
      },
      {
        id: 'reseauxDeFroid-sans-trace',
        'source-layer': 'coldOutline',
        type: 'circle',
        paint: {
          'circle-stroke-color': reseauxDeFroidColor,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 2, 9, 3, 15, 4],
          'circle-color': '#fff',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 0, 8, 0, 9, 4, 15, 10],
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeFroid,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
