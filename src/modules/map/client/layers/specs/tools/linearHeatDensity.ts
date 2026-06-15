import type { MapSourceLayersSpecification } from '../../../core/common';

export const linearHeatDensityLinesSourceId = 'linear-heat-density-lines';
export const linearHeatDensityLabelsSourceId = 'linear-heat-density-labels';
export const linearHeatDensityDefaultColor = '#000091';

export const linearHeatDensityLayersSpec = [
  {
    layers: [
      {
        id: 'linear-heat-density-lines',
        isVisible: (config) => config.densiteThermiqueLineaire,
        paint: { 'line-color': ['get', 'color'], 'line-width': 3 },
        type: 'line',
        unselectable: true,
      },
    ],
    source: { data: { features: [], type: 'FeatureCollection' }, type: 'geojson' },
    sourceId: linearHeatDensityLinesSourceId,
  },
  {
    layers: [
      {
        id: 'linear-heat-density-labels',
        isVisible: (config) => config.densiteThermiqueLineaire,
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
    sourceId: linearHeatDensityLabelsSourceId,
  },
] as const satisfies readonly MapSourceLayersSpecification[];
