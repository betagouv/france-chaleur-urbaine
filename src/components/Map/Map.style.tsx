import { ENERGY_TYPE, ENERGY_USED } from 'src/types/enum/EnergyType';
import styled, { createGlobalStyle } from 'styled-components';
import {
  themeDefEnergy,
  themeDefHeatNetwork,
  themeDefTypeGas,
} from './businessRules';
import param from './Map.param';

const { minZoomData, maxZoom } = param;

const mapOverZindex = 10000;
const mapControlZindex = 10100;

export const MapStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
    .map-wrap {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .map {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .maplibregl-control-container,
    .mapboxgl-control-container {
      > [class*=mapboxgl-] {
        z-index: ${mapOverZindex};
      }
    }

    .maplibregl-marker,
    .mapboxgl-marker {
      z-index: ${mapOverZindex};
    }

    .popover-map-search-form {
      z-index: ${mapControlZindex + 1} !important;
    }

    .popup-map-layer {
      z-index: 10000;
      font-size: .8rem;

      &.maplibregl-popup-anchor-left  .maplibregl-popup-tip {
        border-right-color: #4550e5;
      }
      &.maplibregl-popup-anchor-right  .maplibregl-popup-tip {
        border-left-color: #4550e5;
      }
      &.maplibregl-popup-anchor-top  .maplibregl-popup-tip {
        border-bottom-color: #4550e5;
      }
      &.maplibregl-popup-anchor-bottom  .maplibregl-popup-tip {
        border-top-color: #4550e5;
      }

      .maplibregl-popup-content{
        border: 2px solid #4550e5;
        border-radius: 0.3em;
        overflow: hidden;

        header {
          padding: 7px 25px 7px 10px;
          margin: -15px -10px 10px;
          background-color: #4550e5;
          color: #fff;

          h6 {
            font-size: 1.45em;
            font-weight: bold;
            margin: 0;
          }
          em.coord {
            font-size: 0.85em;
          }
        }

        .maplibregl-popup-close-button {
          font-size: 1.5em;
          line-height: 0;
          font-weight: bold;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25em;
          height: 1.25em;
          padding: 0 0 2px;
          margin: 3px;
          border-radius: 1em;
          transition-property: color, background-color;
          transition-duration: 0.25s;
          transition-timing-function: ease;

          &:hover {
            color: #4550e5;
            background-color: #fff;
          }
        }
      }
    }
`;

// --------------------------
// --- Tooling components ---
// --------------------------

export const MapControlWrapper = styled.div<{}>`
  position: absolute;
  z-index: ${mapControlZindex};

  width: 1000px;
  padding: 1rem;
  bottom: 0;
  left: calc(50% - 500px);
`;

export const MapSearchResult = styled.div`
  padding-top: 3rem;
`;

// --------------------
// --- Heat Network ---
// --------------------

export const outlineLayerStyle = {
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  paint: {
    'line-color': themeDefHeatNetwork.outline.color,
    'line-width': 3,
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
  },
};

// --------------
// --- Energy ---
// --------------

const NB_LOT = 'nb_lot_habitation_bureau_commerce';
const TYPE_ENERGY = 'energie_utilisee';
export const typeEnergy: Record<ENERGY_USED, ENERGY_TYPE> = {
  [ENERGY_USED.Fioul]: ENERGY_TYPE.Fuel,
  [ENERGY_USED.FioulDomestique]: ENERGY_TYPE.Fuel,
  [ENERGY_USED.Gaz]: ENERGY_TYPE.Gas,
  [ENERGY_USED.GazNaturel]: ENERGY_TYPE.Gas,
  [ENERGY_USED.GazCollectif]: ENERGY_TYPE.Gas,
  [ENERGY_USED.GazPropaneButane]: ENERGY_TYPE.Gas,
  [ENERGY_USED.Charbon]: ENERGY_TYPE.Wood,
  [ENERGY_USED.BoisDeChauffage]: ENERGY_TYPE.Wood,
  [ENERGY_USED.Electricite]: ENERGY_TYPE.Electric,
  [ENERGY_USED.EnergieAutre]: ENERGY_TYPE.Unknown,
  [ENERGY_USED.SansObjet]: ENERGY_TYPE.Unknown,
  [ENERGY_USED.Default]: ENERGY_TYPE.Unknown,
};
export const objTypeEnergy = Object.entries(typeEnergy).reduce(
  (acc: any, [key, value]: [string, string]) => {
    return {
      ...acc,
      [value]: [...(acc[value] || []), key],
    };
  },
  {}
);
const arrColorFromDefEnergy = [
  ...Object.entries(themeDefEnergy).flatMap(
    ([energyName, styleObject]: [string, any]) => [
      objTypeEnergy[energyName],
      styleObject.color,
    ]
  ),
  themeDefEnergy.unknow.color,
];
export const energyLayerStyle = {
  type: 'symbol',
  layout: {
    'icon-image': 'energy-picto',
    'symbol-sort-key': ['-', ['coalesce', ['get', NB_LOT], 0]],
    'icon-size': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.1,
      [
        'case',
        ['<', ['get', NB_LOT], 100],
        0.25,
        ['<', ['get', NB_LOT], 1000],
        0.6,
        1,
      ],
      maxZoom,
      [
        'case',
        ['<', ['get', NB_LOT], 100],
        0.25 * 2,
        ['<', ['get', NB_LOT], 1000],
        0.6 * 2,
        1 * 2,
      ],
    ],
  },
  paint: {
    'icon-color': ['match', ['get', TYPE_ENERGY], ...arrColorFromDefEnergy],
    'icon-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.2,
      0,
      minZoomData + 0.5 + 1,
      0.65,
    ],
  },
};

// -----------------
// --- Gas Usage ---
// -----------------
const CONSO = 'conso';
const TYPE_GAS = 'code_grand_secteur';
const arrColorFromDefTypeGas = [
  ...Object.entries(themeDefTypeGas).flatMap(
    ([TypeGasName, styleObject]: [string, any]) => [
      TypeGasName,
      styleObject.color,
    ]
  ),
  themeDefTypeGas.unknow.color,
];

export const gasUsageLayerStyle = {
  type: 'circle',
  layout: {
    'circle-sort-key': ['-', ['coalesce', ['get', CONSO], 0]],
  },
  paint: {
    'circle-color': ['match', ['get', TYPE_GAS], ...arrColorFromDefTypeGas],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.1,
      [
        'case',
        ['<', ['get', CONSO], 100],
        4,
        ['<', ['get', CONSO], 1000],
        8,
        14,
      ],
      maxZoom,
      [
        'case',
        ['<', ['get', CONSO], 100],
        8,
        ['<', ['get', CONSO], 1000],
        16,
        28,
      ],
    ],
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.2,
      0,
      minZoomData + 0.2 + 1,
      0.35,
    ],
    'circle-stroke-opacity': 0,
  },
};

export const demandsLayerStyle = {
  type: 'circle',
  paint: {
    'circle-color': '#FFFFFF',
    'circle-stroke-color': '#FF7576',
    'circle-radius': 4,
    'circle-stroke-width': 2,
    'circle-opacity': 1,
  },
};

export const zoneDPLayerStyle = {
  type: 'fill',
  paint: {
    'fill-color': '#f0bb00',
    'fill-opacity': 0.46,
  },
};

export const Buttons = styled.div`
  display: flex;
  justify-content: space-evenly;
`;
