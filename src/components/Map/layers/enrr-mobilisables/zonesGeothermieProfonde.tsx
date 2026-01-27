import type { MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesZonesGeothermieProfondeLayerColor = '#65a3d6';
export const enrrMobilisablesZonesGeothermieProfondeLayerOpacity = 0.5;

export const enrrMobilisablesZonesGeothermieProfondeLayersSpec = [
  {
    layers: [
      {
        id: 'enrr-mobilisables-zones-geothermie-profonde',
        isVisible: (config) => config.enrrMobilisablesGeothermieProfonde,
        paint: {
          'fill-color': enrrMobilisablesZonesGeothermieProfondeLayerColor,
          'fill-opacity': enrrMobilisablesZonesGeothermieProfondeLayerOpacity,
        },
        type: 'fill',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 11,
      minzoom: 5,
    },
    sourceId: 'enrr-mobilisables-zones-geothermie-profonde',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
