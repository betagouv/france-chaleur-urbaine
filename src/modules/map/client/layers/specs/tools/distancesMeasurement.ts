import type { MapSourceLayersSpecification } from '../../../core/common';

export const distancesMeasurementLinesSourceId = 'distance-measurements-lines';
export const distancesMeasurementLabelsSourceId = 'distance-measurements-labels';

export const distancesMeasurementColorPalette = [
  '#000091',
  '#8e44ad',
  '#2980b9',
  '#27ae60',
  '#c0392b',
  '#d35400',
  '#7f8c8d',
  '#34495e',
  '#16a085',
  '#e67e22',
];

export const distancesMeasurementLayersSpec = [
  {
    layers: [
      {
        id: 'distance-measurements-lines',
        isVisible: (config) => config.mesureDistance,
        paint: { 'line-color': ['get', 'color'], 'line-width': 3 },
        type: 'line',
        unselectable: true,
      },
    ],
    source: { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' },
    sourceId: distancesMeasurementLinesSourceId,
  },
  {
    layers: [
      {
        id: 'distance-measurements-labels',
        isVisible: (config) => config.mesureDistance,
        layout: {
          'symbol-placement': 'point',
          'text-allow-overlap': true,
          'text-anchor': 'center',
          'text-field': ['get', 'distanceLabel'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-offset': [0, 0],
          'text-size': 16,
        },
        paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
        type: 'symbol',
        unselectable: true,
      },
    ],
    source: { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' },
    sourceId: distancesMeasurementLabelsSourceId,
  },
] as const satisfies readonly MapSourceLayersSpecification[];
