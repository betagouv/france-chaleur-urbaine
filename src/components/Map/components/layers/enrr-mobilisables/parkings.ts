import { type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesParkingsLayerColor = '#d0643e';
export const enrrMobilisablesParkingsLayerOpacity = 0.7;

export const enrrMobilisablesParkingsLayersSpec = [
  {
    sourceId: 'enrrMobilisables-parkings',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-parkings/{z}/{x}/{y}'],
      promoteId: 'GmlID',
    },
    layers: [
      {
        id: 'enrrMobilisables-parkings',
        type: 'fill',
        paint: {
          'fill-color': enrrMobilisablesParkingsLayerColor,
          'fill-opacity': enrrMobilisablesParkingsLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
      },
      {
        id: 'enrrMobilisables-parkings-contour',
        type: 'line',
        paint: {
          'line-color': enrrMobilisablesParkingsLayerColor,
          'line-width': 2,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
