import { type ExpressionInputType } from 'maplibre-gl';

import { type GasSummary } from '@/types/Summary/Gas';
import { ObjectEntries } from '@/utils/typescript';

import { intermediateTileLayersMinZoom, type MapSourceLayersSpecification } from './common';

export const consommationsGazLayerStyle = {
  T: '#0032E5',
  R: '#00B8F0',
  I: '#00efaf',
  unknown: '#818181',
};

const minIconSize = 12;
const maxIconSize = 30;
export const consommationsGazLayerMaxOpacity = 0.55;

const GAS_PROPERTY_CONSO: keyof GasSummary = 'conso_nb';
const GAS_PROPERTY_TYPE_GAS: keyof GasSummary = 'code_grand';
const typeWithColorPairs = ObjectEntries(consommationsGazLayerStyle).flatMap(([TypeGasName, styleObject]) => [
  TypeGasName,
  styleObject,
]) as [ExpressionInputType, ExpressionInputType, ...ExpressionInputType[]];

export const consommationsGazInterval = {
  min: 50,
  max: 2000,
};

export const consommationsGazLayersSpec = [
  {
    sourceId: 'gas',
    source: {
      type: 'vector',
      tiles: [`/api/map/gas/{z}/{x}/{y}`],
    },
    layers: [
      {
        id: 'consommationsGaz',
        'source-layer': 'gasUsage',
        minzoom: intermediateTileLayersMinZoom,
        type: 'circle',
        layout: {
          'circle-sort-key': ['-', ['coalesce', ['get', GAS_PROPERTY_CONSO], 0]],
        },
        paint: {
          'circle-color': ['match', ['get', GAS_PROPERTY_TYPE_GAS], ...typeWithColorPairs, consommationsGazLayerStyle.unknown],
          'circle-radius': [
            'case',
            ['<', ['get', GAS_PROPERTY_CONSO], consommationsGazInterval.min],
            minIconSize / 2,
            ['<', ['get', GAS_PROPERTY_CONSO], consommationsGazInterval.max],
            [
              'interpolate',
              ['linear'],
              ['get', GAS_PROPERTY_CONSO],
              consommationsGazInterval.min,
              minIconSize / 2,
              consommationsGazInterval.max,
              maxIconSize / 2,
            ],
            maxIconSize / 2,
          ],
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            intermediateTileLayersMinZoom + 0.2,
            0,
            intermediateTileLayersMinZoom + 0.2 + 1,
            consommationsGazLayerMaxOpacity,
          ],
          'circle-stroke-opacity': 0,
        },
        filter: (config) => {
          const consommationsGazIntervalMin =
            config.consommationsGaz.interval[0] === consommationsGazInterval.min
              ? Number.MIN_SAFE_INTEGER
              : config.consommationsGaz.interval[0];
          const consommationsGazIntervalMax =
            config.consommationsGaz.interval[1] === consommationsGazInterval.max
              ? Number.MAX_SAFE_INTEGER
              : config.consommationsGaz.interval[1];
          return [
            'all',
            config.consommationsGaz.interval
              ? [
                  'all',
                  ['>=', ['get', GAS_PROPERTY_CONSO], consommationsGazIntervalMin],
                  ['<=', ['get', GAS_PROPERTY_CONSO], consommationsGazIntervalMax],
                ]
              : true,
            [
              'any',
              config.consommationsGaz.logements && ['==', ['get', GAS_PROPERTY_TYPE_GAS], 'R'],
              config.consommationsGaz.tertiaire && ['==', ['get', GAS_PROPERTY_TYPE_GAS], 'T'],
              config.consommationsGaz.industrie && ['==', ['get', GAS_PROPERTY_TYPE_GAS], 'I'],
            ],
          ];
        },
        isVisible: (config) => config.consommationsGaz.show,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
