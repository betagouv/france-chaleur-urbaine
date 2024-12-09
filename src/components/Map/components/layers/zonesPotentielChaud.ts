import { darken } from '@/utils/color';

import { ifHoverElse, type MapSourceLayersSpecification } from './common';

export const zonePotentielChaudColor = '#b0cc4e';
export const zonePotentielFortChaudColor = '#448d60';
export const zonePotentielChaudOpacity = 0.3;

export const zonesPotentielChaudLayersSpec = [
  {
    sourceId: 'zonesPotentielChaud',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielChaud/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielChaud',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielChaudColor, 40), zonePotentielChaudColor),
          'fill-opacity': zonePotentielChaudOpacity,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
      },
      {
        id: 'zonesPotentielChaud-contour',
        type: 'line',
        paint: {
          'line-color': zonePotentielChaudColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
        unselectable: true,
      },
    ],
  },

  {
    sourceId: 'zonesPotentielFortChaud',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielFortChaud/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielFortChaud',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielFortChaudColor, 40), zonePotentielFortChaudColor),
          'fill-opacity': zonePotentielChaudOpacity,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
      },
      {
        id: 'zonesPotentielFortChaud-contour',
        type: 'line',
        paint: {
          'line-color': zonePotentielFortChaudColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
