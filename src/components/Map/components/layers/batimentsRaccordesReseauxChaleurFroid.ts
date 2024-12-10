import { type MapSourceLayersSpecification } from './common';

export const batimentsRaccordesReseauxDeChaleurColor = '#079067';
export const batimentsRaccordesReseauxDeFroidColor = '#0094FF';

export const batimentsRaccordesReseauxChaleurFroidOpacity = 0.65;

export const batimentsRaccordesReseauxChaleurFroidLayersSpec = [
  {
    sourceId: 'batimentsRaccordesReseauxChaleurFroid',
    source: {
      type: 'vector',
      tiles: [`/api/map/batimentsRaccordesReseauxChaleurFroid/{z}/{x}/{y}`],
      minzoom: 9,
      maxzoom: 13, // 13 permet de cliquer jusqu'au zoom 20 inclus, sinon maplibre ne considère pas la feature comme cliquable
    },
    layers: [
      {
        id: 'batimentsRaccordesReseauxChaleur',
        'source-layer': 'batiments_raccordes_reseaux_chaleur',
        minzoom: 9,
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.1, 12, 0.5],
        },
        paint: {
          'icon-color': batimentsRaccordesReseauxDeChaleurColor,
          'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9.2, 0, 10.5, batimentsRaccordesReseauxChaleurFroidOpacity],
        },
        isVisible: (config) => config.batimentsRaccordesReseauxChaleur,
      },
      {
        id: 'batimentsRaccordesReseauxFroid',
        'source-layer': 'batiments_raccordes_reseaux_froid',
        minzoom: 9,
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.1, 12, 0.5],
        },
        paint: {
          'icon-color': batimentsRaccordesReseauxDeFroidColor,
          'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9.2, 0, 10.5, batimentsRaccordesReseauxChaleurFroidOpacity],
        },
        isVisible: (config) => config.batimentsRaccordesReseauxFroid,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
