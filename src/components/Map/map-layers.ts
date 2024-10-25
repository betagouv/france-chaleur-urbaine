import {
  CircleLayerSpecification,
  DataDrivenPropertyValueSpecification,
  ExpressionInputType,
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  LineLayerSpecification,
  Map,
  SourceSpecification,
  StyleSetterOptions,
} from 'maplibre-gl';

import { intervalsEqual } from '@utils/interval';
import { formatMWhString } from '@utils/strings';
import {
  themeDefBuildings,
  themeDefDemands,
  themeDefEnergy,
  themeDefHeatNetwork,
  themeDefTypeGas,
  themeDefZoneDP,
} from 'src/services/Map/businessRules';
import { arrColorFromDefBuildingsDpeEnergy } from 'src/services/Map/businessRules/buildings';
import { themeDefSolaireThermiqueFriches, themeDefSolaireThermiqueParkings } from 'src/services/Map/businessRules/enrrMobilisables';
import { themeDefZonePotentielChaud, themeDefZonePotentielFortChaud } from 'src/services/Map/businessRules/zonePotentielChaud';
import { MapConfiguration, filtresEnergies, percentageMaxInterval } from 'src/services/Map/map-configuration';
import { SourceId } from 'src/services/tiles.config';
import { ENERGY_TYPE, ENERGY_USED } from 'src/types/enum/EnergyType';
import { Network } from 'src/types/Summary/Network';

import { buildingsDataExtractionLayers } from './components/tools/BuildingsDataExtractionTool';
import { distancesMeasurementLayers } from './components/tools/DistancesMeasurementTool';
import { linearHeatDensityLayers } from './components/tools/LinearHeatDensityTool';
import {
  communesFortPotentielPourCreationReseauxChaleurLayerColor,
  communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
} from './map-styles';

export const tileSourcesMaxZoom = 17;

export const tileLayersMinZoom = 0;
export const intermediateTileLayersMinZoom = 12;

// gas usage & energy
export const minIconSize = 12;
export const maxIconSize = 30;

export const consommationsGazLayerMaxOpacity = 0.55;
export const energyLayerMaxOpacity = 0.65;
export const batimentsRaccordesLayerMaxOpacity = 0.65;

type LayerSymbolSpecification = {
  key: string;
  url: string;
  sdf?: boolean; // Whether the image should be interpreted as an SDF image (= image we want to color)
};

/**
 * Symbols used by layers and that must be loaded at map initialization.
 */
export const layerSymbolsImagesURLs = [
  {
    key: 'square',
    url: '/icons/square.png',
    sdf: true,
  },
  {
    key: 'enrr_mobilisables_datacenter',
    url: '/icons/enrr_mobilisables_datacenter.png',
  },
  {
    key: 'enrr_mobilisables_industrie',
    url: '/icons/enrr_mobilisables_industrie.png',
  },
  {
    key: 'enrr_mobilisables_installations_electrogenes',
    url: '/icons/enrr_mobilisables_installations_electrogenes.png',
  },
  {
    key: 'enrr_mobilisables_stations_epuration',
    url: '/icons/enrr_mobilisables_stations_epuration.png',
  },
  {
    key: 'enrr_mobilisables_unites_incineration',
    url: '/icons/enrr_mobilisables_unites_incineration.png',
  },
] as const satisfies ReadonlyArray<LayerSymbolSpecification>;

type LayerSymbolImage = (typeof layerSymbolsImagesURLs)[number]['key'];

export const LegendDeskData = {
  energy: {
    min: 10,
    max: 150,
  },
  gasUsage: {
    min: 50,
    max: 2000,
  },
  communesFortPotentielPourCreationReseauxChaleurNbHabitants: {
    min: 0,
    max: 100000,
  },
};

// --------------------
// --- Heat Network ---
// --------------------

export const outlineCenterLayerStyle: Pick<CircleLayerSpecification, 'type' | 'paint'> = {
  type: 'circle',
  paint: {
    'circle-stroke-color': [
      'case',
      ['boolean', ['get', 'reseaux classes']],
      themeDefHeatNetwork.classed.color,
      themeDefHeatNetwork.outline.color,
    ],
    'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 2, 9, 3, 15, 4],
    'circle-color': '#fff',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 0, 8, 0, 9, 4, 15, 10],
  },
};

export const outlineLayerStyle: Pick<LineLayerSpecification, 'type' | 'layout' | 'paint'> = {
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  paint: {
    'line-color': ['case', ['boolean', ['get', 'reseaux classes']], themeDefHeatNetwork.classed.color, themeDefHeatNetwork.outline.color],
    'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 2],
    'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
  },
};

// -----------------
// --- Gas Usage ---
// -----------------
const CONSO = 'conso_nb';
const TYPE_GAS = 'code_grand';
const arrColorFromDefTypeGas = [
  ...Object.entries(themeDefTypeGas).flatMap(([TypeGasName, styleObject]: [string, any]) => [TypeGasName, styleObject.color]),
] as [ExpressionInputType, ExpressionInputType, ...ExpressionInputType[]];

// --------------
// --- Energy ---
// --------------
const NB_LOT = 'nb_logements';
const TYPE_ENERGY = 'energie_utilisee';
export const typeEnergy = {
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
const arrColorFromDefEnergy = Object.entries(themeDefEnergy).flatMap(([energyName, styleObject]: [string, any]) => [
  objTypeEnergy[energyName],
  styleObject.color,
]) as [ExpressionInputType, ExpressionInputType, ...ExpressionInputType[]];

const iconSize = 31;
const maxDisplaySize = 29;
const iconRatio = 1 / (iconSize / maxDisplaySize);
const getSymbolRatio: (size: number) => number = (size) => iconRatio * (size / maxDisplaySize);

type ColorThreshold = {
  value: number;
  color: `#${string}`;
};
type LegendInterval = {
  min: string;
  max: string;
  color: `#${string}`;
};

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

const besoinsEnChaleurIndustrieCommunesDefaultColor = '#fbf2e7';
const besoinsEnChaleurIndustrieCommunesMaxValue = 1_500_000;
const besoinsEnChaleurIndustrieCommunesThresholds: ColorThreshold[] = [
  {
    value: 31000,
    color: '#f3dce2',
  },
  {
    value: 101000,
    color: '#eac5dd',
  },
  {
    value: 222000,
    color: '#e6b9da',
  },
  {
    value: 425000,
    color: '#d1a8cc',
  },
  {
    value: 764000,
    color: '#bc97bd',
  },
];

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

export const besoinsEnChaleurIndustrieCommunesIntervals: LegendInterval[] = [
  {
    min: formatMWhString(0),
    max: formatMWhString(besoinsEnChaleurIndustrieCommunesThresholds[0].value),
    color: besoinsEnChaleurIndustrieCommunesDefaultColor,
  },
  ...besoinsEnChaleurIndustrieCommunesThresholds.map((threshold, index, array) => {
    return {
      min: formatMWhString(threshold.value),
      max: formatMWhString(array[index + 1]?.value ?? besoinsEnChaleurIndustrieCommunesMaxValue),
      color: threshold.color,
    };
  }),
];

export type MapSourceLayersSpecification = {
  sourceId: SourceId;
  source: SourceSpecification;
  layers: CustomLayerSpecification[];
};

type CustomLayerSpecification = LayerSpecification & {
  id: LayerId;
  source: SourceId;
  layout?: LayerSpecification['layout'] & {
    'icon-image'?: LayerSymbolImage;
  };
};

export type LayerId =
  | 'reseauxDeChaleur-avec-trace'
  | 'reseauxDeChaleur-sans-trace'
  | 'reseauxEnConstruction-zone'
  | 'reseauxEnConstruction-trace'
  | 'reseauxDeFroid-avec-trace'
  | 'reseauxDeFroid-sans-trace'
  | 'zonesDeDeveloppementPrioritaire'
  | 'demandesEligibilite'
  | 'energy'
  | 'consommationsGaz'
  | 'batimentsRaccordes'
  | 'enrrMobilisables-datacenter'
  | 'enrrMobilisables-industrie'
  | 'enrrMobilisables-installations-electrogenes'
  | 'enrrMobilisables-stations-d-epuration'
  | 'enrrMobilisables-unites-d-incineration'
  | 'enrrMobilisables-friches'
  | 'enrrMobilisables-friches-contour'
  | 'enrrMobilisables-parkings'
  | 'enrrMobilisables-parkings-contour'
  | 'zonesPotentielChaud'
  | 'zonesPotentielChaud-contour'
  | 'zonesPotentielFortChaud'
  | 'zonesPotentielFortChaud-contour'
  | 'besoinsEnChaleur'
  | 'besoinsEnFroid'
  | 'besoinsEnChaleurFroid-contour'
  | 'besoinsEnChaleurIndustrieCommunes'
  | 'besoinsEnChaleurIndustrieCommunes-contour'
  | 'communesFortPotentielPourCreationReseauxChaleur'
  | 'caracteristiquesBatiments'
  | 'distance-measurements-lines'
  | 'distance-measurements-labels'
  | 'linear-heat-density-lines'
  | 'linear-heat-density-labels'
  | 'buildings-data-extraction-fill'
  | 'buildings-data-extraction-outline';

const zoomOpacityTransitionAt10: DataDrivenPropertyValueSpecification<number> = [
  'interpolate',
  ['linear'],
  ['zoom'],
  10 + 0.2,
  0,
  10 + 0.2 + 1,
  1,
];

// besoin d'une fonction dynamique pour avoir location.origin disponible côté client et aussi
// pouvoir construire les layers selon les filtres
export function buildMapLayers(config: MapConfiguration): MapSourceLayersSpecification[] {
  return [
    // ---------------------------
    // --- zonesPotentielChaud ---
    // ---------------------------
    {
      sourceId: 'zonesPotentielChaud',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/zonesPotentielChaud/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
        promoteId: 'id_zone',
      },
      layers: [
        {
          id: 'zonesPotentielChaud',
          source: 'zonesPotentielChaud',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'fill',
          paint: {
            'fill-color': themeDefZonePotentielChaud.fill.color,
            'fill-opacity': themeDefZonePotentielChaud.fill.opacity,
          },
        },
        {
          id: 'zonesPotentielChaud-contour',
          source: 'zonesPotentielChaud',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'line',
          paint: {
            'line-color': themeDefZonePotentielChaud.fill.color,
            'line-width': 2,
          },
        },
      ],
    },

    // -------------------------------
    // --- zonesPotentielFortChaud ---
    // -------------------------------
    {
      sourceId: 'zonesPotentielFortChaud',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/zonesPotentielFortChaud/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
        promoteId: 'id_zone',
      },
      layers: [
        {
          id: 'zonesPotentielFortChaud',
          source: 'zonesPotentielFortChaud',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'fill',
          paint: {
            'fill-color': themeDefZonePotentielFortChaud.fill.color,
            'fill-opacity': themeDefZonePotentielFortChaud.fill.opacity,
          },
        },
        {
          id: 'zonesPotentielFortChaud-contour',
          source: 'zonesPotentielFortChaud',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'line',
          paint: {
            'line-color': themeDefZonePotentielFortChaud.fill.color,
            'line-width': 2,
          },
        },
      ],
    },

    {
      sourceId: 'besoinsEnChaleurIndustrieCommunes',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/besoinsEnChaleurIndustrieCommunes/{z}/{x}/{y}`],
        minzoom: 5,
        maxzoom: 11,
      },
      layers: [
        {
          id: 'besoinsEnChaleurIndustrieCommunes',
          source: 'besoinsEnChaleurIndustrieCommunes',
          'source-layer': 'layer',
          type: 'fill',
          paint: {
            'fill-color': [
              'step',
              ['coalesce', ['get', 'conso_chal'], 0],
              besoinsEnChaleurIndustrieCommunesDefaultColor,
              ...besoinsEnChaleurIndustrieCommunesThresholds.flatMap((v) => [v.value, v.color]),
            ],
            'fill-opacity': 0.7,
          },
        },
        {
          id: 'besoinsEnChaleurIndustrieCommunes-contour',
          source: 'besoinsEnChaleurIndustrieCommunes',
          'source-layer': 'layer',
          type: 'line',
          paint: {
            'line-color': '#777777',
            'line-width': 1,
          },
        },
      ],
    },

    // ------------------------------------------
    // --- Zones de développement prioritaire ---
    // ------------------------------------------
    {
      sourceId: 'zoneDP',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/zoneDP/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'zonesDeDeveloppementPrioritaire',
          source: 'zoneDP',
          'source-layer': 'zoneDP',
          minzoom: tileLayersMinZoom,
          type: 'fill',
          paint: {
            'fill-color': themeDefZoneDP.fill.color,
            'fill-opacity': themeDefZoneDP.fill.opacity,
          },
        },
      ],
    },

    // ---------------------------
    // --- Future Heat Network ---
    // ---------------------------
    {
      sourceId: 'futurNetwork',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/futurNetwork/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'reseauxEnConstruction-zone',
          source: 'futurNetwork',
          'source-layer': 'futurOutline',
          minzoom: tileLayersMinZoom,
          filter: ['all', ['==', ['get', 'is_zone'], true], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
          type: 'fill',
          paint: {
            'fill-color': themeDefHeatNetwork.futur.color,
            'fill-opacity': themeDefHeatNetwork.futur.opacity,
          },
        },
        {
          id: 'reseauxEnConstruction-trace',
          source: 'futurNetwork',
          'source-layer': 'futurOutline',
          minzoom: tileLayersMinZoom,
          filter: ['all', ['==', ['get', 'is_zone'], false], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
          ...outlineLayerStyle,
          paint: {
            ...outlineLayerStyle.paint,
            'line-color': themeDefHeatNetwork.futur.color,
          },
        },
      ],
    },

    // --------------------------------------------
    // --- Besoins en chaleur des bâtiments ---
    // --------------------------------------------
    {
      sourceId: 'besoinsEnChaleur',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/besoinsEnChaleur/{z}/{x}/{y}`],
        minzoom: 10,
        maxzoom: 14,
      },
      layers: [
        {
          id: 'besoinsEnFroid',
          source: 'besoinsEnChaleur',
          'source-layer': 'layer',
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
        },
        {
          id: 'besoinsEnChaleur',
          source: 'besoinsEnChaleur',
          'source-layer': 'layer',
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
        },
        {
          id: 'besoinsEnChaleurFroid-contour',
          source: 'besoinsEnChaleur',
          'source-layer': 'layer',
          type: 'line',
          paint: {
            'line-color': '#777777',
            'line-width': 0.5,
            'line-opacity': zoomOpacityTransitionAt10,
          },
        },
      ],
    },

    // --------------------------------------------
    // --- Caractéristiques des bâtiments (DPE) ---
    // --------------------------------------------
    {
      sourceId: 'buildings',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/buildings/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'caracteristiquesBatiments',
          source: 'buildings',
          'source-layer': 'buildings',
          minzoom: intermediateTileLayersMinZoom,
          type: 'fill',
          paint: {
            'fill-color': [
              'match',
              ['downcase', ['coalesce', ['get', 'dpe_energie'], 'N']],
              ...arrColorFromDefBuildingsDpeEnergy,
              themeDefBuildings.colors.unknow.color,
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              intermediateTileLayersMinZoom + 0.2,
              0,
              intermediateTileLayersMinZoom + 0.2 + 1,
              themeDefBuildings.opacity,
            ],
          },
        },
      ],
    },

    // --------------------------------------------
    // ---      Friches solaire thermique       ---
    // --------------------------------------------
    {
      sourceId: 'enrrMobilisables-friches',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/enrrMobilisables-friches/{z}/{x}/{y}`],
        promoteId: 'GmlID',
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'enrrMobilisables-friches',
          source: 'enrrMobilisables-friches',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'fill',
          paint: {
            'fill-color': themeDefSolaireThermiqueFriches.color,
            'fill-opacity': themeDefSolaireThermiqueFriches.opacity,
          },
        },
        {
          id: 'enrrMobilisables-friches-contour',
          source: 'enrrMobilisables-friches',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'line',
          paint: {
            'line-color': themeDefSolaireThermiqueFriches.color,
            'line-width': 2,
          },
        },
      ],
    },

    // --------------------------------------------
    // ---      Parkings de plus de 500m²       ---
    // --------------------------------------------
    {
      sourceId: 'enrrMobilisables-parkings',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/enrrMobilisables-parkings/{z}/{x}/{y}`],
        promoteId: 'GmlID',
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'enrrMobilisables-parkings',
          source: 'enrrMobilisables-parkings',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'fill',
          paint: {
            'fill-color': themeDefSolaireThermiqueParkings.color,
            'fill-opacity': themeDefSolaireThermiqueParkings.opacity,
          },
        },
        {
          id: 'enrrMobilisables-parkings-contour',
          source: 'enrrMobilisables-parkings',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'line',
          paint: {
            'line-color': themeDefSolaireThermiqueParkings.color,
            'line-width': 2,
          },
        },
      ],
    },

    // ---------------------
    // --- Raccordements ---
    // ---------------------
    {
      sourceId: 'raccordements',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/raccordements/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'batimentsRaccordes',
          source: 'raccordements',
          'source-layer': 'raccordements',
          minzoom: intermediateTileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'square',
            'icon-overlap': 'always',
            'icon-size': 0.5,
          },
          paint: {
            'icon-color': themeDefHeatNetwork.classed.color,
            'icon-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              intermediateTileLayersMinZoom + 0.2,
              0,
              intermediateTileLayersMinZoom + 0.5 + 1,
              batimentsRaccordesLayerMaxOpacity,
            ],
          },
        },
      ],
    },

    // --------------
    // --- Energy ---
    // --------------
    {
      sourceId: 'energy',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/energy/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'energy',
          source: 'energy',
          'source-layer': 'energy',
          minzoom: intermediateTileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'square',
            'icon-overlap': 'always',
            'symbol-sort-key': ['-', ['coalesce', ['get', NB_LOT], 0]],
            'icon-size': [
              'case',
              ['<', ['get', NB_LOT], LegendDeskData.energy.min],
              getSymbolRatio(minIconSize),
              ['<', ['get', NB_LOT], LegendDeskData.energy.max],
              [
                'interpolate',
                ['linear'],
                ['get', NB_LOT],
                LegendDeskData.energy.min,
                getSymbolRatio(minIconSize),
                LegendDeskData.energy.max,
                getSymbolRatio(maxIconSize),
              ],
              getSymbolRatio(maxIconSize),
            ],
          },
          paint: {
            'icon-color': ['match', ['get', TYPE_ENERGY], ...arrColorFromDefEnergy, themeDefEnergy.unknow.color],
            'icon-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              intermediateTileLayersMinZoom + 0.2,
              0,
              intermediateTileLayersMinZoom + 0.5 + 1,
              energyLayerMaxOpacity,
            ],
          },
        },
      ],
    },

    // -----------------
    // --- Gas Usage ---
    // -----------------
    {
      sourceId: 'gas',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/gas/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'consommationsGaz',
          source: 'gas',
          'source-layer': 'gasUsage',
          minzoom: intermediateTileLayersMinZoom,
          type: 'circle',
          layout: {
            'circle-sort-key': ['-', ['coalesce', ['get', CONSO], 0]],
          },
          paint: {
            'circle-color': ['match', ['get', TYPE_GAS], ...arrColorFromDefTypeGas, themeDefTypeGas.unknow.color],
            'circle-radius': [
              'case',
              ['<', ['get', CONSO], LegendDeskData.gasUsage.min],
              minIconSize / 2,
              ['<', ['get', CONSO], LegendDeskData.gasUsage.max],
              [
                'interpolate',
                ['linear'],
                ['get', CONSO],
                LegendDeskData.gasUsage.min,
                minIconSize / 2,
                LegendDeskData.gasUsage.max,
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
        },
      ],
    },

    // -----------------
    // --- Demands ---
    // -----------------
    {
      sourceId: 'demands',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/demands/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'demandesEligibilite',
          source: 'demands',
          'source-layer': 'demands',
          minzoom: tileLayersMinZoom,
          type: 'circle',
          paint: {
            'circle-color': themeDefDemands.fill.color,
            'circle-stroke-color': themeDefDemands.stroke.color,
            'circle-radius': themeDefDemands.fill.size,
            'circle-stroke-width': themeDefDemands.stroke.size,
          },
        },
      ],
    },

    // --------------------
    // --- Heat Network ---
    // --------------------
    {
      sourceId: 'network',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/network/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'reseauxDeChaleur-avec-trace',
          source: 'network',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          ...outlineLayerStyle,
          filter: [
            'all',
            ['==', ['get', 'has_trace'], true],
            ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
            ...buildFiltreGestionnaire(config.filtreGestionnaire),
            ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
          ],
        },
        {
          id: 'reseauxDeChaleur-sans-trace',
          source: 'network',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          ...outlineCenterLayerStyle,
          filter: [
            'all',
            ['==', ['get', 'has_trace'], false],
            ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
            ...buildFiltreGestionnaire(config.filtreGestionnaire),
            ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
          ],
        },
      ],
    },

    // --------------------
    // --- Cold Network ---
    // --------------------
    {
      sourceId: 'coldNetwork',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/coldNetwork/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
      },
      layers: [
        {
          id: 'reseauxDeFroid-avec-trace',
          source: 'coldNetwork',
          'source-layer': 'coldOutline',
          minzoom: tileLayersMinZoom,
          ...outlineLayerStyle,
          paint: {
            ...outlineLayerStyle.paint,
            'line-color': themeDefHeatNetwork.cold.color,
          },
          filter: [
            'all',
            ['==', ['get', 'has_trace'], true],
            ...buildFiltreGestionnaire(config.filtreGestionnaire),
            ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
          ],
        },
        {
          id: 'reseauxDeFroid-sans-trace',
          source: 'coldNetwork',
          'source-layer': 'coldOutline',
          minzoom: tileLayersMinZoom,
          ...outlineCenterLayerStyle,
          paint: {
            ...outlineCenterLayerStyle.paint,
            'circle-stroke-color': themeDefHeatNetwork.cold.color,
          },
          filter: [
            'all',
            ['==', ['get', 'has_trace'], false],
            ...buildFiltreGestionnaire(config.filtreGestionnaire),
            ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
          ],
        },
      ],
    },

    {
      sourceId: 'enrrMobilisables',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/enrrMobilisables/{z}/{x}/{y}`],
        maxzoom: tileSourcesMaxZoom,
        promoteId: 'GmlID',
      },

      // the source contains one layer that contains all features
      // we know the kind of one feature using the GmlID (e.g. datacenter.1)
      // we have 5 layers, one for each kind of features to simplify show/hide code
      layers: [
        {
          id: 'enrrMobilisables-stations-d-epuration',
          source: 'enrrMobilisables',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'enrr_mobilisables_stations_epuration',
            'icon-overlap': 'always',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
          },

          filter: ['in', 'stations_d_epuration', ['get', 'GmlID']],
        },
        {
          id: 'enrrMobilisables-datacenter',
          source: 'enrrMobilisables',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'enrr_mobilisables_datacenter',
            'icon-overlap': 'always',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
          },

          filter: ['in', 'datacenter', ['get', 'GmlID']],
        },
        {
          id: 'enrrMobilisables-industrie',
          source: 'enrrMobilisables',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'enrr_mobilisables_industrie',
            'icon-overlap': 'always',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
          },

          filter: ['in', 'industrie', ['get', 'GmlID']],
        },
        {
          id: 'enrrMobilisables-installations-electrogenes',
          source: 'enrrMobilisables',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'enrr_mobilisables_installations_electrogenes',
            'icon-overlap': 'always',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
          },

          filter: ['in', 'installations_electrogenes', ['get', 'GmlID']],
        },
        {
          id: 'enrrMobilisables-unites-d-incineration',
          source: 'enrrMobilisables',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'symbol',
          layout: {
            'icon-image': 'enrr_mobilisables_unites_incineration',
            'icon-overlap': 'always',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
          },

          filter: ['in', 'unites_d_incineration', ['get', 'GmlID']],
        },
      ],
    },

    {
      sourceId: 'communesFortPotentielPourCreationReseauxChaleur',
      source: {
        type: 'vector',
        tiles: [`${location.origin}/api/map/communesFortPotentielPourCreationReseauxChaleur/{z}/{x}/{y}`],
        minzoom: 5,
        maxzoom: 6,
      },
      layers: [
        {
          id: 'communesFortPotentielPourCreationReseauxChaleur',
          source: 'communesFortPotentielPourCreationReseauxChaleur',
          'source-layer': 'layer',
          minzoom: tileLayersMinZoom,
          type: 'circle',
          layout: {
            'circle-sort-key': ['-', ['get', 'population']],
          },
          paint: {
            'circle-color': communesFortPotentielPourCreationReseauxChaleurLayerColor,
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['+', ['get', 'zones_fort_potentiel_chauf_mwh'], ['get', 'zones_fort_potentiel_ecs_mwh']],
              0,
              4,
              160_000, // ~ max value
              20,
            ],
            'circle-opacity': communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
          },
          filter: [
            'all',
            ['>=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[0]],
            ['<=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[1]],
          ],
        },
      ],
    },
  ];
}
export function buildInternalMapLayers(): MapSourceLayersSpecification[] {
  return [...distancesMeasurementLayers, ...linearHeatDensityLayers, ...buildingsDataExtractionLayers];
}

// extends the Map type to get fully typed layer and source ids
interface FCUMap extends Map {
  getLayer(id: LayerId): ReturnType<Map['getLayer']>;
  setLayoutProperty(layerId: LayerId, name: string, value: any, options?: StyleSetterOptions): this;

  setFilter(layerId: LayerId, filter?: FilterSpecification | null, options?: StyleSetterOptions): this;
}

/**
 * Apply the map configuration to the map layers.
 */
export function applyMapConfigurationToLayers(map: FCUMap, config: MapConfiguration) {
  function setLayerVisibility(layerId: LayerId, visible: boolean) {
    if (!map.getLayer(layerId)) {
      console.warn(`Layer '${layerId}' is not set on map`);
      return;
    }
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }

  setLayerVisibility('caracteristiquesBatiments', config.caracteristiquesBatiments);
  setLayerVisibility('besoinsEnChaleur', config.besoinsEnChaleur);
  setLayerVisibility('besoinsEnFroid', config.besoinsEnFroid);
  setLayerVisibility('besoinsEnChaleurFroid-contour', config.besoinsEnChaleur || config.besoinsEnFroid);
  setLayerVisibility('besoinsEnChaleurIndustrieCommunes', config.besoinsEnChaleurIndustrieCommunes);
  setLayerVisibility('besoinsEnChaleurIndustrieCommunes-contour', config.besoinsEnChaleurIndustrieCommunes);
  setLayerVisibility('communesFortPotentielPourCreationReseauxChaleur', config.communesFortPotentielPourCreationReseauxChaleur.show);
  setLayerVisibility('reseauxDeFroid-avec-trace', config.reseauxDeFroid);
  setLayerVisibility('reseauxDeFroid-sans-trace', config.reseauxDeFroid);
  setLayerVisibility('demandesEligibilite', config.demandesEligibilite);
  setLayerVisibility('energy', config.batimentsFioulCollectif.show || config.batimentsGazCollectif.show);
  setLayerVisibility('reseauxEnConstruction-trace', config.reseauxEnConstruction);
  setLayerVisibility('reseauxEnConstruction-zone', config.reseauxEnConstruction);
  setLayerVisibility('consommationsGaz', config.consommationsGaz.show);
  setLayerVisibility('reseauxDeChaleur-avec-trace', config.reseauxDeChaleur.show);
  setLayerVisibility('reseauxDeChaleur-sans-trace', config.reseauxDeChaleur.show);
  setLayerVisibility('batimentsRaccordes', config.batimentsRaccordes);
  setLayerVisibility('zonesDeDeveloppementPrioritaire', config.zonesDeDeveloppementPrioritaire);
  setLayerVisibility(
    'enrrMobilisables-datacenter',
    config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showDatacenters
  );
  setLayerVisibility(
    'enrrMobilisables-industrie',
    config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showIndustrie
  );
  setLayerVisibility(
    'enrrMobilisables-installations-electrogenes',
    config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showInstallationsElectrogenes
  );
  setLayerVisibility(
    'enrrMobilisables-stations-d-epuration',
    config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showStationsDEpuration
  );
  setLayerVisibility(
    'enrrMobilisables-unites-d-incineration',
    config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showUnitesDIncineration
  );
  setLayerVisibility(
    'enrrMobilisables-friches',
    config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches
  );
  setLayerVisibility(
    'enrrMobilisables-friches-contour',
    config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches
  );
  setLayerVisibility(
    'enrrMobilisables-parkings',
    config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings
  );
  setLayerVisibility(
    'enrrMobilisables-parkings-contour',
    config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings
  );
  setLayerVisibility('zonesPotentielChaud', config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud);
  setLayerVisibility('zonesPotentielChaud-contour', config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud);
  setLayerVisibility('zonesPotentielFortChaud', config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud);
  setLayerVisibility('zonesPotentielFortChaud-contour', config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud);

  // custom filters for energy and consommationsGaz

  const TYPE_ENERGY = 'energie_utilisee';
  const batimentsFioulCollectifMin =
    config.batimentsFioulCollectif.interval[0] === LegendDeskData.energy.min
      ? Number.MIN_SAFE_INTEGER
      : config.batimentsFioulCollectif.interval[0];
  const batimentsFioulCollectifMax =
    config.batimentsFioulCollectif.interval[1] === LegendDeskData.energy.max
      ? Number.MAX_SAFE_INTEGER
      : config.batimentsFioulCollectif.interval[1];
  const batimentsGazCollectifMin =
    config.batimentsGazCollectif.interval[0] === LegendDeskData.energy.min
      ? Number.MIN_SAFE_INTEGER
      : config.batimentsGazCollectif.interval[0];
  const batimentsGazCollectifMax =
    config.batimentsGazCollectif.interval[1] === LegendDeskData.energy.max
      ? Number.MAX_SAFE_INTEGER
      : config.batimentsGazCollectif.interval[1];
  map.setFilter('energy', [
    'any',
    config.batimentsFioulCollectif.show
      ? [
          'all',
          ['==', ['get', TYPE_ENERGY], 'fioul'],
          ['all', ['>=', ['get', NB_LOT], batimentsFioulCollectifMin], ['<=', ['get', NB_LOT], batimentsFioulCollectifMax]],
        ]
      : ['literal', false],
    config.batimentsGazCollectif.show
      ? [
          'all',
          ['==', ['get', TYPE_ENERGY], 'gaz'],
          ['all', ['>=', ['get', NB_LOT], batimentsGazCollectifMin], ['<=', ['get', NB_LOT], batimentsGazCollectifMax]],
        ]
      : ['literal', false],
  ]);

  const consommationsGazIntervalMin =
    config.consommationsGaz.interval[0] === LegendDeskData.gasUsage.min ? Number.MIN_SAFE_INTEGER : config.consommationsGaz.interval[0];
  const consommationsGazIntervalMax =
    config.consommationsGaz.interval[1] === LegendDeskData.gasUsage.max ? Number.MAX_SAFE_INTEGER : config.consommationsGaz.interval[1];
  map.setFilter(
    'consommationsGaz',
    config.consommationsGaz.show && [
      'all',
      config.consommationsGaz.interval
        ? ['all', ['>=', ['get', CONSO], consommationsGazIntervalMin], ['<=', ['get', CONSO], consommationsGazIntervalMax]]
        : true,
      [
        'any',
        config.consommationsGaz.logements && ['==', ['get', TYPE_GAS], 'R'],
        config.consommationsGaz.tertiaire && ['==', ['get', TYPE_GAS], 'T'],
        config.consommationsGaz.industrie && ['==', ['get', TYPE_GAS], 'I'],
      ],
    ]
  );

  map.setFilter('reseauxDeChaleur-avec-trace', [
    'all',
    ['==', ['get', 'has_trace'], true],
    ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
    ...buildFiltreGestionnaire(config.filtreGestionnaire),
    ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
  ]);
  map.setFilter('reseauxDeChaleur-sans-trace', [
    'all',
    ['==', ['get', 'has_trace'], false],
    ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
    ...buildFiltreGestionnaire(config.filtreGestionnaire),
    ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
  ]);
  map.setFilter('reseauxDeFroid-avec-trace', [
    'all',
    ['==', ['get', 'has_trace'], true],
    ...buildFiltreGestionnaire(config.filtreGestionnaire),
    ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
  ]);
  map.setFilter('reseauxDeFroid-sans-trace', [
    'all',
    ['==', ['get', 'has_trace'], false],
    ...buildFiltreGestionnaire(config.filtreGestionnaire),
    ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
  ]);
  map.setFilter('reseauxEnConstruction-zone', [
    'all',
    ['==', ['get', 'is_zone'], true],
    ...buildFiltreGestionnaire(config.filtreGestionnaire),
  ]);
  map.setFilter('reseauxEnConstruction-trace', [
    'all',
    ['==', ['get', 'is_zone'], false],
    ...buildFiltreGestionnaire(config.filtreGestionnaire),
  ]);
  map.setFilter('communesFortPotentielPourCreationReseauxChaleur', [
    'all',
    ['>=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[0]],
    ['<=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[1]],
  ]);

  setLayerVisibility('distance-measurements-labels', config.mesureDistance);
  setLayerVisibility('distance-measurements-lines', config.mesureDistance);
  setLayerVisibility('linear-heat-density-labels', config.densiteThermiqueLineaire);
  setLayerVisibility('linear-heat-density-lines', config.densiteThermiqueLineaire);
  setLayerVisibility('buildings-data-extraction-fill', config.extractionDonneesBatiment);
  setLayerVisibility('buildings-data-extraction-outline', config.extractionDonneesBatiment);
}

type ReseauxDeChaleurFilter = {
  valueKey: keyof Network;
  confKey: Exclude<keyof MapConfiguration['reseauxDeChaleur'], 'show'>;
  filterPreprocess?: (v: number) => number;
};

export const reseauxDeChaleurFilters = [
  {
    confKey: 'tauxENRR',
    valueKey: 'Taux EnR&R',
  },
  {
    confKey: 'emissionsCO2',
    valueKey: 'contenu CO2 ACV',
    filterPreprocess: (v: number) => v / 1000,
  },
  {
    confKey: 'prixMoyen',
    valueKey: 'PM',
  },
  {
    confKey: 'livraisonsAnnuelles',
    valueKey: 'livraisons_totale_MWh',
    filterPreprocess: (v: number) => v * 1000,
  },
  {
    confKey: 'anneeConstruction',
    valueKey: 'annee_creation',
  },
] satisfies ReseauxDeChaleurFilter[];

export type ReseauxDeChaleurLimits = Record<(typeof reseauxDeChaleurFilters)[number]['confKey'], [min: number, max: number]>;

/**
 * Applique chaque filtre de réseau de chaleur si l'intervalle est compris
 * dans [min, max], ou les désactive s'ils sont strictement égaux à l'intervalle par défaut.
 */
function buildReseauxDeChaleurFilters(conf: MapConfiguration['reseauxDeChaleur']): ExpressionSpecification[] {
  return [
    ...(conf.energieMobilisee && conf.energieMobilisee.length > 0
      ? conf.energieMobilisee.map(
          (energie) => ['>', ['coalesce', ['get', `energie_ratio_${energie}`]], 0] satisfies ExpressionSpecification
        )
      : []),
    ...reseauxDeChaleurFilters.flatMap((filtre) => {
      const minValue = filtre.filterPreprocess ? filtre.filterPreprocess(conf[filtre.confKey][0]) : conf[filtre.confKey][0];
      const maxValue = filtre.filterPreprocess ? filtre.filterPreprocess(conf[filtre.confKey][1]) : conf[filtre.confKey][1];

      return intervalsEqual(conf[filtre.confKey], conf.limits![filtre.confKey])
        ? []
        : ([
            ['>=', ['coalesce', ['get', filtre.valueKey], Number.MIN_SAFE_INTEGER], minValue],
            ['<=', ['coalesce', ['get', filtre.valueKey], Number.MAX_SAFE_INTEGER], maxValue],
          ] satisfies ExpressionSpecification[]);
    }),
    ...filtresEnergies.flatMap((filtre) => {
      const fullConfKey = `energie_ratio_${filtre.confKey}` as const;
      const interval = conf[fullConfKey];
      const minValue = interval[0];
      const maxValue = interval[1];

      return intervalsEqual(interval, percentageMaxInterval)
        ? []
        : ([
            ['>=', ['coalesce', ['get', fullConfKey], Number.MIN_SAFE_INTEGER], minValue / 100],
            ['<=', ['coalesce', ['get', fullConfKey], Number.MAX_SAFE_INTEGER], maxValue / 100],
          ] satisfies ExpressionSpecification[]);
    }),
  ].filter((v) => v !== null);
}

function buildFiltreGestionnaire(filtreGestionnaire: MapConfiguration['filtreGestionnaire']): ExpressionSpecification[] {
  return filtreGestionnaire.length > 0
    ? [
        [
          'any',
          ...filtreGestionnaire.flatMap(
            (filtre) =>
              [
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'gestionnaire'], '']], // futurNetwork
                ],
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']], // coldNetwork and network
                ],
              ] satisfies ExpressionSpecification[]
          ),
        ],
      ]
    : [];
}

function buildFiltreIdentifiantReseau(filtreIdentifiantReseau: MapConfiguration['filtreIdentifiantReseau']): ExpressionSpecification[] {
  return filtreIdentifiantReseau.length > 0
    ? [['in', ['coalesce', ['get', 'Identifiant reseau'], ''], ['literal', filtreIdentifiantReseau]]]
    : [];
}
