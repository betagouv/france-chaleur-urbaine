import type { DataDrivenPropertyValueSpecification, ExpressionInputType } from 'maplibre-gl';

import DPE from '@/components/DPE';
import { ENERGY_TYPE, ENERGY_USED } from '@/types/enum/EnergyType';
import type { EnergySummary } from '@/types/Summary/Energy';
import { deepMergeObjects } from '@/utils/core';
import { formatTypeEnergieChauffage } from '@/utils/format';
import { ObjectEntries } from '@/utils/typescript';
import type { MapLayerSpecification } from '../map-layers';
import { ifHoverElse, intermediateTileLayersMinZoom, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const minIconSize = 12;
export const maxIconSize = 30;
export const typeChauffageBatimentsOpacity = 0.65;

export const typeChauffageBatimentsCollectifsStyle = {
  electric: '#4cd362',
  fuelOil: '#F07300',
  gas: '#9181F4',
  unknown: '#818181',
  wood: '#955e15',
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
]) as [string, ExpressionInputType, ...ExpressionInputType[]];

export const energyFilterInterval = {
  max: 150,
  min: 10,
};

const iconSize = 31;
const maxDisplaySize = 29;
const iconRatio = 1 / (iconSize / maxDisplaySize);
const getSymbolRatio: (size: number) => number = (size) => iconRatio * (size / maxDisplaySize);

const ENERGY_PROPERTY_NB_LOT: keyof EnergySummary = 'nb_logements';
const ENERGY_PROPERTY_TYPE_ENERGY: keyof EnergySummary = 'energie_utilisee';

export const typeChauffageBatimentsCollectifsLayersSpec = [
  {
    layers: [
      ...buildLayerAndHoverLayer({
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
        id: 'energy',
        isVisible: (config) => config.batimentsFioulCollectif.show || config.batimentsGazCollectif.show,
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
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
          'symbol-sort-key': ['-', ['coalesce', ['get', ENERGY_PROPERTY_NB_LOT], 0]],
        },
        minzoom: intermediateTileLayersMinZoom,
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
        popup: Popup,
        'source-layer': 'energy',
        type: 'symbol',
      }),
    ],
    source: {
      tiles: [`/api/map/energy/{z}/{x}/{y}`],
      type: 'vector',
    },
    sourceId: 'energy',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

/**
 * Construit 2 couches identiques, une pour voir les données,
 * l'autre pour afficher la feature survolée (icone plus grande)
 */
function buildLayerAndHoverLayer<LayerId extends string>(
  layerSpec: MapLayerSpecification<LayerId>
): readonly [MapLayerSpecification<LayerId>, MapLayerSpecification<`${LayerId}-hover`>] {
  const baseLayer = deepMergeObjects(layerSpec, {
    paint: {
      'icon-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        intermediateTileLayersMinZoom + 0.2,
        0,
        intermediateTileLayersMinZoom + 0.5 + 1,
        ifHoverElse(0, typeChauffageBatimentsOpacity),
      ],
    },
  });

  const { popupOffset, ...layerSpecWithoutOffset } = layerSpec;

  const iconSizeExpression = [
    '+',
    0.3,
    [
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
  ] as DataDrivenPropertyValueSpecification<number>;

  const hoverLayer: MapLayerSpecification<`${LayerId}-hover`> = {
    ...layerSpecWithoutOffset,
    id: `${layerSpec.id}-hover` as const,
    layout: {
      ...layerSpec.layout,
      'icon-size': iconSizeExpression,
    },
    paint: {
      ...layerSpec.paint,
      'icon-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        intermediateTileLayersMinZoom + 0.2,
        0,
        intermediateTileLayersMinZoom + 0.5 + 1,
        ifHoverElse(typeChauffageBatimentsOpacity, 0),
      ],
    },
    popup: undefined,
    unselectable: true as const,
  };

  return [baseLayer, hoverLayer] as const;
}

function Popup(caracteristiqueBatiment: EnergySummary, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{caracteristiqueBatiment.addr_label}</Title>
      <TwoColumns>
        <Property label="Année de construction" value={caracteristiqueBatiment.annee_construction} />
        <Property label="Usage" value={caracteristiqueBatiment.type_usage} />
        <Property label="Nombre de logements" value={caracteristiqueBatiment.nb_logements} />
        <Property label="Chauffage actuel" value={caracteristiqueBatiment.energie_utilisee} formatter={formatTypeEnergieChauffage} />
        <Property label="Mode de chauffage" value={caracteristiqueBatiment.type_chauffage} />
        <Property
          label="DPE consommations énergétiques"
          value={caracteristiqueBatiment.dpe_energie}
          formatter={(v) => <DPE classe={v} />}
        />
        <Property
          label="DPE émissions de gaz à effet de serre"
          value={caracteristiqueBatiment.dpe_ges}
          formatter={(v) => <DPE classe={v} />}
        />
      </TwoColumns>
    </>
  );
}
