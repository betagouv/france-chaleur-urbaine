import {
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
} from '@components/shared/layout/MainLayout';
import styled, { createGlobalStyle, css } from 'styled-components';
import param from './Map.param';

const { minZoomData, maxZoom } = param;

const mapOverZindex = 10000;
const mapControlZindex = 10100;

// Mask Params:
const maskTop = '3.5rem';
const maskBottom = '7rem';
const scrollSize = '15px';

export const MapStyle = createGlobalStyle`
    .map-wrap {
      position: relative;
      width: 100%;
      height: calc(
        100vh - ${fullscreenHeaderHeight} - ${fullscreenFooterHeight}
      );
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

    .search-result-box {
      height: 100%;
      overflow: auto;
      overflow-y: auto;
      overflow-y: overlay;
      overflow-x: visible;
      padding-bottom: 6rem;

      mask-image: linear-gradient(180deg, transparent 0, black 0%),
      linear-gradient(
        180deg,
        rgba(0, 0, 0, .3) 0,
        black ${maskTop},
        black calc(100% - ${maskBottom}),
        transparent 100%
      );
    mask-size: ${scrollSize}, calc(100% - ${scrollSize});
    mask-repeat: no-repeat, no-repeat;
    mask-position: right top, left top;

    }
`;

// --------------------------
// --- Tooling components ---
// --------------------------

export const MapControlWrapper = styled.div<{
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}>`
  position: absolute;
  z-index: ${mapControlZindex};

  max-width: 28%;
  width: 100%;
  min-width: 250px;
  padding: 1rem;

  ${({ bottom }) =>
    bottom
      ? css`
          bottom: 0;
        `
      : css`
          top: 0;
        `}
  ${({ right }) =>
    right
      ? css`
          right: 0;
        `
      : css`
          left: 0;
        `}
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
    'line-color': '#2d9748',
    'line-width': 3,
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
  },
};
export const substationLayerStyle = {
  type: 'fill',
  layout: {},
  paint: {
    'fill-color': '#ff00d4',
    'fill-opacity': 1,
  },
};
export const boilerRoomLayerStyle = {
  type: 'fill',
  layout: {},
  paint: {
    'fill-color': '#ff6600',
    'fill-outline-color': '#ff6600',
    'fill-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 0.95],
  },
};

// --------------
// --- Energy ---
// --------------

const NB_LOT = 'nb_lot_habitation_bureau_commerce';
const TYPE_ENERGY = 'energie_utilisee';
const typeEnergy: Record<string, string> = {
  fioul: 'fuelOil',
  fioul_domestique: 'fuelOil',
  gaz: 'gas',
  gaz_naturel: 'gas',
  gaz_propane_butane: 'gas',
  charbon: 'wood',
  bois_de_chauffage: 'wood',
  electricite: 'electric',
  energie_autre: 'unknow',
  'sans objet': 'unknow',
  default: 'unknow',
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
const themeDefEnergy: any = {
  fuelOil: { color: '#c72e6e' },
  gas: { color: '#9c47e2' },
  wood: { color: '#ce7f17' },
  electric: { color: '#4cd362' },
  unknow: { color: '#818181' },
};
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
  type: 'circle',
  layout: {
    'circle-sort-key': ['-', ['coalesce', ['get', NB_LOT], 0]],
  },
  paint: {
    'circle-color': ['match', ['get', TYPE_ENERGY], ...arrColorFromDefEnergy],
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.1,
      [
        'case',
        ['<', ['get', NB_LOT], 100],
        4,
        ['<', ['get', NB_LOT], 1000],
        8,
        15,
      ],
      maxZoom,
      [
        'case',
        ['<', ['get', NB_LOT], 100],
        8,
        ['<', ['get', NB_LOT], 1000],
        16,
        30,
      ],
    ],
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.2,
      0,
      minZoomData + 0.5 + 1,
      0.65,
    ],
    'circle-stroke-opacity': 0,
  },
};

// -----------------
// --- Gas Usage ---
// -----------------
const CONSO = 'conso';
const TYPE_GAS = 'code_grand_secteur';
const themeDefTypeGas: any = {
  T: { color: '#13e0d6' },
  R: { color: '#136ce0' },
  unknow: { color: '#818181' },
};
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
        15,
      ],
      maxZoom,
      [
        'case',
        ['<', ['get', CONSO], 100],
        8,
        ['<', ['get', CONSO], 1000],
        16,
        30,
      ],
    ],
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoomData + 0.2,
      0,
      minZoomData + 0.2 + 1,
      0.25,
    ],
    'circle-stroke-opacity': 0,
  },
};
