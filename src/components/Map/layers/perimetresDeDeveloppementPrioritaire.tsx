import type { MapSourceLayersSpecification } from './common';

export const perimetresDeDeveloppementPrioritaireColor = '#f0bb00';
export const perimetresDeDeveloppementPrioritaireOpacity = 0.47;

export const perimetresDeDeveloppementPrioritaireLayersSpec = [
  {
    layers: [
      {
        id: 'zonesDeDeveloppementPrioritaire',
        isVisible: (config) => config.zonesDeDeveloppementPrioritaire,
        paint: {
          'fill-color': perimetresDeDeveloppementPrioritaireColor,
          'fill-opacity': perimetresDeDeveloppementPrioritaireOpacity,
        },
        'source-layer': 'zoneDP',
        type: 'fill',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 14,
      tiles: ['/api/map/zoneDP/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'zoneDP',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
