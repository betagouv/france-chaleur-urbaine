import { type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesThalassothermieLayerColor = '#4c64c9';
export const enrrMobilisablesThalassothermieLayerOpacity = 0.6;

export const enrrMobilisablesThalassothermieLayersSpec = [
  {
    sourceId: 'enrrMobilisables-thalassothermie',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-thalassothermie/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 12,
    },
    layers: [
      {
        id: 'enrrMobilisables-thalassothermie',
        type: 'fill',
        paint: {
          'fill-color': enrrMobilisablesThalassothermieLayerColor,
          'fill-opacity': enrrMobilisablesThalassothermieLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesThalassothermie,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
