import { type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesFrichesLayerColor = '#dc958e';
export const enrrMobilisablesFrichesLayerOpacity = 0.7;

export const enrrMobilisablesFrichesLayersSpec = [
  {
    sourceId: 'enrrMobilisables-friches',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-friches/{z}/{x}/{y}'],
      promoteId: 'GmlID',
    },
    layers: [
      {
        id: 'enrrMobilisables-friches',
        type: 'fill',
        paint: {
          'fill-color': enrrMobilisablesFrichesLayerColor,
          'fill-opacity': enrrMobilisablesFrichesLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches,
      },
      {
        id: 'enrrMobilisables-friches-contour',
        type: 'line',
        paint: {
          'line-color': enrrMobilisablesFrichesLayerColor,
          'line-width': 2,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
