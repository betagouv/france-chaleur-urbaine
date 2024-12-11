import { type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire, buildFiltreIdentifiantReseau, buildReseauxDeChaleurFilters } from './filters';

export const reseauDeChaleurClasseColor = '#079067';
export const reseauDeChaleurNonClasseColor = '#7CC558';

export const reseauxDeChaleurLayersSpec = [
  {
    sourceId: 'network',
    source: {
      type: 'vector',
      tiles: ['/api/map/network/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxDeChaleur-avec-trace',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['case', ['boolean', ['get', 'reseaux classes']], reseauDeChaleurClasseColor, reseauDeChaleurNonClasseColor],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 2],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeChaleur.show,
      },
      {
        id: 'reseauxDeChaleur-sans-trace',
        type: 'circle',
        paint: {
          'circle-stroke-color': [
            'case',
            ['boolean', ['get', 'reseaux classes']],
            reseauDeChaleurClasseColor,
            reseauDeChaleurNonClasseColor,
          ],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 2, 9, 3, 15, 4],
          'circle-color': '#fff',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 0, 8, 0, 9, 4, 15, 10],
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeChaleur.show,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
