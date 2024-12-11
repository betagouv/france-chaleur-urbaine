import { type MapSourceLayersSpecification } from './common';

export const installationsGeothermieProfondeLayerColor = '#8400a8';
export const installationsGeothermieProfondeLayerOpacity = 0.8;

export const installationsGeothermieSurfaceEchangeursFermesRealiseeColor = '#b96210';
export const installationsGeothermieSurfaceEchangeursFermesDeclareeColor = '#c6c614';
export const installationsGeothermieSurfaceEchangeursFermesOpacity = 0.8;

export const installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor = '#3217f0';
export const installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor = '#17f0f0';
export const installationsGeothermieSurfaceEchangeursOuvertsOpacity = 0.8;

export const installationsGeothermieLayersSpec = [
  {
    sourceId: 'installationsGeothermieProfonde',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieProfonde/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 6,
    },
    layers: [
      {
        id: 'installationsGeothermieProfonde',
        type: 'circle',
        paint: {
          'circle-color': installationsGeothermieProfondeLayerColor,
          'circle-radius': 8,
          'circle-opacity': installationsGeothermieProfondeLayerOpacity,
        },
        isVisible: (config) => config.installationsGeothermieProfonde,
      },
    ],
  },
  {
    sourceId: 'installationsGeothermieSurfaceEchangeursFermes',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieSurfaceEchangeursFermes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'installationsGeothermieSurfaceEchangeursFermes',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'statut_inst'], 'Déclaré'],
            installationsGeothermieSurfaceEchangeursFermesDeclareeColor,
            installationsGeothermieSurfaceEchangeursFermesRealiseeColor,
          ],
          'circle-radius': 8,
          'circle-opacity': installationsGeothermieSurfaceEchangeursFermesOpacity,
        },
        isVisible: (config) => config.installationsGeothermieSurfaceEchangeursFermes,
      },
    ],
  },
  {
    sourceId: 'installationsGeothermieSurfaceEchangeursOuverts',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieSurfaceEchangeursOuverts/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'installationsGeothermieSurfaceEchangeursOuverts',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'statut_inst'], 'Déclaré'],
            installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor,
            installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor,
          ],
          'circle-radius': 8,
          'circle-opacity': installationsGeothermieSurfaceEchangeursOuvertsOpacity,
        },
        isVisible: (config) => config.installationsGeothermieSurfaceEchangeursOuverts,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
