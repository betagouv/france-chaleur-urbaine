import type { MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesZonesGeothermieProfondeLayerColor = '#65a3d6';
export const enrrMobilisablesZonesGeothermieProfondeLayerOpacity = 0.5;

export const enrrMobilisablesZonesGeothermieProfondeLayersSpec = [
  {
    layers: [
      {
        id: 'enrrMobilisables-zonesGeothermieProfonde',
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
      tiles: ['/api/map/enrrMobilisables-zonesGeothermieProfonde/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'enrrMobilisables-zonesGeothermieProfonde',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
