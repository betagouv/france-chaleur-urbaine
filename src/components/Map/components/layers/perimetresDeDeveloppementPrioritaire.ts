import { type MapSourceLayersSpecification } from './common';

export const perimetresDeDeveloppementPrioritaireColor = '#f0bb00';
export const perimetresDeDeveloppementPrioritaireOpacity = 0.47;

export const perimetresDeDeveloppementPrioritaireLayersSpec = [
  {
    sourceId: 'zoneDP',
    source: {
      type: 'vector',
      tiles: ['/api/map/zoneDP/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'zonesDeDeveloppementPrioritaire',
        'source-layer': 'zoneDP',
        type: 'fill',
        paint: {
          'fill-color': perimetresDeDeveloppementPrioritaireColor,
          'fill-opacity': perimetresDeDeveloppementPrioritaireOpacity,
        },
        isVisible: (config) => config.zonesDeDeveloppementPrioritaire,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
