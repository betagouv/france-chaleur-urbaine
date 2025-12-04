import type { DataDrivenPropertyValueSpecification, ExpressionInputType } from 'maplibre-gl';
import { BdnbBatimentPopup, bdnbBatimentsTilesSource } from '@/components/Map/layers/bdnb/common';
import { intermediateTileLayersMinZoom } from '@/modules/tiles/constants';
import type { BdnbBatimentTile } from '@/modules/tiles/server/generation-config';
import { deepMergeObjects } from '@/utils/core';
import { ObjectEntries } from '@/utils/typescript';
import type { MapLayerSpecification } from '../../map-layers';
import { ifHoverElse, type MapSourceLayersSpecification } from '../common';

export const minIconSize = 12;
export const maxIconSize = 30;
export const typeChauffageBatimentsOpacity = 0.65;

export const typeChauffageBatimentsCollectifsStyle = {
  fioul: '#F07300',
  gaz: '#9181F4',
  'reseau de chaleur': '#079067',
};

const typeWithColorPairs = ObjectEntries(typeChauffageBatimentsCollectifsStyle).flatMap(([energyName, styleObject]) => [
  energyName,
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

const ENERGY_PROPERTY_NB_LOT: keyof BdnbBatimentTile = 'ffo_bat_nb_log';
const ENERGY_PROPERTY_TYPE_ENERGY: keyof BdnbBatimentTile = 'dpe_representatif_logement_type_energie_chauffage';
const ENERGY_PROPERTY_TYPE_INSTALLATION: keyof BdnbBatimentTile = 'dpe_representatif_logement_type_installation_chauffage';

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
            'all',
            ['==', ['get', ENERGY_PROPERTY_TYPE_INSTALLATION], 'collectif'],
            [
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
            ],
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
          'icon-color': ['match', ['get', ENERGY_PROPERTY_TYPE_ENERGY], ...typeWithColorPairs, '#000'],
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
        popup: BdnbBatimentPopup,
        type: 'symbol',
      }),
    ],
    source: bdnbBatimentsTilesSource,
    sourceId: 'bdnbBatiments',
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
