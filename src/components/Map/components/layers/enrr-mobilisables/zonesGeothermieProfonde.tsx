import { type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesZonesGeothermieProfondeLayerColor = '#65a3d6';
export const enrrMobilisablesZonesGeothermieProfondeLayerOpacity = 0.5;

export const enrrMobilisablesZonesGeothermieProfondeLayersSpec = [
  {
    sourceId: 'enrrMobilisables-zonesGeothermieProfonde',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-zonesGeothermieProfonde/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 11,
    },
    layers: [
      {
        id: 'enrrMobilisables-zonesGeothermieProfonde',
        type: 'fill',
        paint: {
          'fill-color': enrrMobilisablesZonesGeothermieProfondeLayerColor,
          'fill-opacity': enrrMobilisablesZonesGeothermieProfondeLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesGeothermieProfonde,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
