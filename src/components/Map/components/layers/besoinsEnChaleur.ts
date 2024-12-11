import { formatMWhString } from '@/utils/strings';

import { type LegendInterval, zoomOpacityTransitionAt10, type ColorThreshold, type MapSourceLayersSpecification } from './common';

const besoinsBatimentsDefaultColor = '#ffffff';
const besoinsEnChaleurMaxValue = 6_000;
const besoinsEnChaleurColorThresholds: ColorThreshold[] = [
  {
    value: 20,
    color: '#ffffe5',
  },
  {
    value: 30,
    color: '#fff7bc',
  },
  {
    value: 50,
    color: '#fee391',
  },
  {
    value: 75,
    color: '#fec44f',
  },
  {
    value: 150,
    color: '#fe9929',
  },
  {
    value: 300,
    color: '#ec7014',
  },
  {
    value: 600,
    color: '#cc4c02',
  },
  {
    value: 900,
    color: '#993404',
  },
  {
    value: 1200,
    color: '#662506',
  },
];
const besoinsEnFroidMaxValue = 5_000;
const besoinsEnFroidColorThresholds: ColorThreshold[] = [
  {
    value: 5,
    color: '#deebf7',
  },
  {
    value: 10,
    color: '#c6dbef',
  },
  {
    value: 15,
    color: '#9ecae1',
  },
  {
    value: 30,
    color: '#6baed6',
  },
  {
    value: 50,
    color: '#4292c6',
  },
  {
    value: 70,
    color: '#2171b5',
  },
  {
    value: 100,
    color: '#08519c',
  },
  {
    value: 300,
    color: '#08306b',
  },
];

export const besoinsEnChaleurLayersSpec = [
  {
    sourceId: 'besoinsEnChaleur',
    source: {
      type: 'vector',
      tiles: ['/api/map/besoinsEnChaleur/{z}/{x}/{y}'],
      minzoom: 10,
      maxzoom: 14,
    },
    layers: [
      {
        id: 'besoinsEnFroid',
        type: 'fill',
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['get', 'FROID_MWH'], 0],
            besoinsBatimentsDefaultColor,
            ...besoinsEnFroidColorThresholds.flatMap((v) => [v.value, v.color]),
          ],
          'fill-opacity': zoomOpacityTransitionAt10,
        },
        isVisible: (config) => config.besoinsEnFroid,
      },
      {
        id: 'besoinsEnChaleur',
        type: 'fill',
        paint: {
          'fill-color': [
            'step',
            ['coalesce', ['coalesce', ['get', 'CHAUF_MWH'], 0], 0],
            besoinsBatimentsDefaultColor,
            ...besoinsEnChaleurColorThresholds.flatMap((v) => [v.value, v.color]),
          ],
          'fill-opacity': zoomOpacityTransitionAt10,
        },
        isVisible: (config) => config.besoinsEnChaleur,
      },
      {
        id: 'besoinsEnChaleurFroid-contour',
        type: 'line',
        paint: {
          'line-color': '#777777',
          'line-width': 0.5,
          'line-opacity': zoomOpacityTransitionAt10,
        },
        isVisible: (config) => config.besoinsEnChaleur || config.besoinsEnFroid,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

// used by the legend
export const besoinsEnChaleurIntervals: LegendInterval[] = [
  {
    min: formatMWhString(0),
    max: formatMWhString(besoinsEnChaleurColorThresholds[0].value),
    color: besoinsBatimentsDefaultColor,
  },
  ...besoinsEnChaleurColorThresholds.map((threshold, index, array) => {
    return {
      min: formatMWhString(threshold.value),
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnChaleurMaxValue),
      color: threshold.color,
    };
  }),
];

export const besoinsEnFroidIntervals: LegendInterval[] = [
  {
    min: formatMWhString(0),
    max: formatMWhString(besoinsEnFroidColorThresholds[0].value),
    color: besoinsBatimentsDefaultColor,
  },
  ...besoinsEnFroidColorThresholds.map((threshold, index, array) => {
    return {
      min: formatMWhString(threshold.value),
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnFroidMaxValue),
      color: threshold.color,
    };
  }),
];
