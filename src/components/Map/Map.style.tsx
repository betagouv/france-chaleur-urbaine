import { ENERGY_TYPE, ENERGY_USED } from 'src/types/enum/EnergyType';
import styled, { createGlobalStyle, css } from 'styled-components';
import {
  themeDefBuildings,
  themeDefDemands,
  themeDefEnergy,
  themeDefHeatNetwork,
  themeDefTypeGas,
  themeDefZoneDP,
} from './businessRules';
import param from './Map.param';

const { minZoomData, maxZoom } = param;

const mapOverZindex = 10000;
const mapControlZindex = 10100;

export const MapStyle: any = createGlobalStyle<{
  legendCollapsed: boolean;
}>` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
    .map-wrap {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
    }

    .map {
      position: absolute;
      left: ${({ legendCollapsed }) => (legendCollapsed ? '0px' : '333px')};
      width: ${({ legendCollapsed }) =>
        legendCollapsed ? '100%' : 'calc(100% - 333px)'};
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
      z-index: 10101;
      font-size: 14px;

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
          padding: 8px;
          margin: -15px -10px 10px;
          background-color: #4550e5;

          h6 {
            color: #fff;
            font-size: 15px;
            font-weight: bold;
            margin: 0;
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

export const MapControlWrapper = styled.div<{ legendCollapsed: boolean }>`
  position: absolute;
  z-index: ${mapControlZindex};

  width: 1000px;
  padding: 1rem;
  bottom: 0;
  left: ${({ legendCollapsed }) =>
    legendCollapsed ? 'calc(50% - 500px)' : 'calc((50% + 166px) - 500px)'};
`;

export const Legend = styled.div<{ legendCollapsed: boolean }>`
  z-index: ${mapControlZindex};
  overflow: scroll;
  ${({ legendCollapsed }) =>
    legendCollapsed &&
    css`
      display: none;
    `}
  width: 333px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #dddddd;
  box-shadow: 0px 16px 16px -16px rgba(0, 0, 0, 0.32),
    0px 8px 16px rgba(0, 0, 0, 0.1);
`;

export const LegendSeparator = styled.div`
  width: 100%;
  border: 1px solid #e1e1e1;
  margin: 16px 0;
`;

export const CollapseLegend = styled.button<{ legendCollapsed: boolean }>`
  position: absolute;
  padding: 0 0 0 9px;
  z-index: ${mapControlZindex};
  left: ${({ legendCollapsed }) => (legendCollapsed ? '-11px' : '322px')};
  top: 50%;
  border-radius: 10px;
  background-color: white;
  height: 42px;
  width: 22px;
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

const NB_LOT = 'nb_logements';
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
    'circle-color': themeDefDemands.fill.color,
    'circle-stroke-color': themeDefDemands.stroke.color,
    'circle-radius': themeDefDemands.fill.size,
    'circle-stroke-width': themeDefDemands.stroke.size,
  },
};

export const zoneDPLayerStyle = {
  type: 'fill',
  paint: {
    'fill-color': themeDefZoneDP.fill.color,
    'fill-opacity': themeDefZoneDP.fill.opacity,
  },
};

const DPE_ENERGY = 'dpe_energie';
const arrColorFromDefBuildingsDpeEnergy = [
  ...Object.entries(themeDefBuildings.colors).flatMap(
    ([dpeCode, dpeStyleDef]: [string, any]) => [dpeCode, dpeStyleDef.color]
  ),
  themeDefBuildings.colors.unknow.color,
];

export const buildingsLayerStyle = {
  type: 'fill',
  paint: {
    'fill-color': [
      'match',
      ['downcase', ['get', DPE_ENERGY]],
      ...arrColorFromDefBuildingsDpeEnergy,
    ],
    'fill-outline-color': '#555555',
    'fill-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.2,
      0,
      minZoomData + 0.2 + 1,
      themeDefBuildings.opacity,
    ],
  },
};

export const Buttons = styled.div`
  display: flex;
  justify-content: space-evenly;
`;
