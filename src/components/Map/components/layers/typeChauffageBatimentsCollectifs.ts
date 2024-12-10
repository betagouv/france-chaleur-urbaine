import { type ExpressionInputType } from 'maplibre-gl';

import { ENERGY_TYPE, ENERGY_USED } from '@/types/enum/EnergyType';
import { type EnergySummary } from '@/types/Summary/Energy';
import { ObjectEntries } from '@/utils/typescript';

import { intermediateTileLayersMinZoom, type MapSourceLayersSpecification } from './common';

export const minIconSize = 12;
export const maxIconSize = 30;
export const typeChauffageBatimentsOpacity = 0.65;

export const typeChauffageBatimentsCollectifsStyle = {
  fuelOil: '#F07300',
  gas: '#9181F4',
  wood: '#955e15',
  electric: '#4cd362',
  unknown: '#818181',
};

const typeEnergy = {
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

export const objTypeEnergy = Object.entries(typeEnergy).reduce((acc: any, [key, value]: [string, string]) => {
  return {
    ...acc,
    [value]: [...(acc[value] || []), key],
  };
}, {});

const typeWithColorPairs = ObjectEntries(typeChauffageBatimentsCollectifsStyle).flatMap(([energyName, styleObject]) => [
  objTypeEnergy[energyName],
  styleObject,
]) as [ExpressionInputType, ExpressionInputType, ...ExpressionInputType[]];

export const energyFilterInterval = {
  min: 10,
  max: 150,
};

const iconSize = 31;
const maxDisplaySize = 29;
const iconRatio = 1 / (iconSize / maxDisplaySize);
const getSymbolRatio: (size: number) => number = (size) => iconRatio * (size / maxDisplaySize);

const ENERGY_PROPERTY_NB_LOT: keyof EnergySummary = 'nb_logements';
const ENERGY_PROPERTY_TYPE_ENERGY: keyof EnergySummary = 'energie_utilisee';

export const typeChauffageBatimentsCollectifsLayersSpec = [
  {
    sourceId: 'energy',
    source: {
      type: 'vector',
      tiles: [`/api/map/energy/{z}/{x}/{y}`],
    },
    layers: [
      {
        id: 'energy',
        'source-layer': 'energy',
        minzoom: intermediateTileLayersMinZoom,
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'symbol-sort-key': ['-', ['coalesce', ['get', ENERGY_PROPERTY_NB_LOT], 0]],
          'icon-size': [
            'case',
            ['<', ['get', ENERGY_PROPERTY_NB_LOT], energyFilterInterval.min],
            getSymbolRatio(minIconSize),
            ['<', ['get', ENERGY_PROPERTY_NB_LOT], energyFilterInterval.max],
            [
              'interpolate',
              ['linear'],
              ['get', ENERGY_PROPERTY_NB_LOT],
              energyFilterInterval.min,
              getSymbolRatio(minIconSize),
              energyFilterInterval.max,
              getSymbolRatio(maxIconSize),
            ],
            getSymbolRatio(maxIconSize),
          ],
        },
        paint: {
          'icon-color': [
            'match',
            ['get', ENERGY_PROPERTY_TYPE_ENERGY],
            ...typeWithColorPairs,
            typeChauffageBatimentsCollectifsStyle.unknown,
          ],
          'icon-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            intermediateTileLayersMinZoom + 0.2,
            0,
            intermediateTileLayersMinZoom + 0.5 + 1,
            typeChauffageBatimentsOpacity,
          ],
        },
        filter: (config) => {
          const batimentsFioulCollectifMin =
            config.batimentsFioulCollectif.interval[0] === energyFilterInterval.min
              ? Number.MIN_SAFE_INTEGER
              : config.batimentsFioulCollectif.interval[0];
          const batimentsFioulCollectifMax =
            config.batimentsFioulCollectif.interval[1] === energyFilterInterval.max
              ? Number.MAX_SAFE_INTEGER
              : config.batimentsFioulCollectif.interval[1];
          const batimentsGazCollectifMin =
            config.batimentsGazCollectif.interval[0] === energyFilterInterval.min
              ? Number.MIN_SAFE_INTEGER
              : config.batimentsGazCollectif.interval[0];
          const batimentsGazCollectifMax =
            config.batimentsGazCollectif.interval[1] === energyFilterInterval.max
              ? Number.MAX_SAFE_INTEGER
              : config.batimentsGazCollectif.interval[1];
          return [
            'any',
            config.batimentsFioulCollectif.show
              ? [
                  'all',
                  ['==', ['get', ENERGY_PROPERTY_TYPE_ENERGY], 'fioul'],
                  [
                    'all',
                    ['>=', ['get', ENERGY_PROPERTY_NB_LOT], batimentsFioulCollectifMin],
                    ['<=', ['get', ENERGY_PROPERTY_NB_LOT], batimentsFioulCollectifMax],
                  ],
                ]
              : ['literal', false],
            config.batimentsGazCollectif.show
              ? [
                  'all',
                  ['==', ['get', ENERGY_PROPERTY_TYPE_ENERGY], 'gaz'],
                  [
                    'all',
                    ['>=', ['get', ENERGY_PROPERTY_NB_LOT], batimentsGazCollectifMin],
                    ['<=', ['get', ENERGY_PROPERTY_NB_LOT], batimentsGazCollectifMax],
                  ],
                ]
              : ['literal', false],
          ];
        },
        isVisible: (config) => config.batimentsFioulCollectif.show || config.batimentsGazCollectif.show,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
