import {
  type CircleLayerSpecification,
  type DataDrivenPropertyValueSpecification,
  type ExpressionInputType,
  type ExpressionSpecification,
  type FilterSpecification,
  type LayerSpecification,
  type LineLayerSpecification,
  type Map,
  type SourceSpecification,
  type StyleSetterOptions,
} from 'maplibre-gl';

import { clientConfig } from '@/client-config';
import { type SourceId } from '@/server/services/tiles.config';
import { gestionnairesFilters } from '@/services';
import {
  themeDefBuildings,
  themeDefDemands,
  themeDefEnergy,
  themeDefHeatNetwork,
  themeDefTypeGas,
  themeDefZoneDP,
} from '@/services/Map/businessRules';
import { arrColorFromDefBuildingsDpeEnergy } from '@/services/Map/businessRules/buildings';
import { themeDefSolaireThermiqueFriches, themeDefSolaireThermiqueParkings } from '@/services/Map/businessRules/enrrMobilisables';
import { themeDefZonePotentielChaud, themeDefZonePotentielFortChaud } from '@/services/Map/businessRules/zonePotentielChaud';
import { type MapConfiguration, filtresEnergies, percentageMaxInterval } from '@/services/Map/map-configuration';
import { ENERGY_TYPE, ENERGY_USED } from '@/types/enum/EnergyType';
import { type EnergySummary } from '@/types/Summary/Energy';
import { type GasSummary } from '@/types/Summary/Gas';
import { type Network } from '@/types/Summary/Network';
import { deepMergeObjects, isDefined } from '@/utils/core';
import { intervalsEqual } from '@/utils/interval';
import { formatMWhString } from '@/utils/strings';

import { buildingsDataExtractionLayers } from './components/tools/BuildingsDataExtractionTool';
import { distancesMeasurementLayers } from './components/tools/DistancesMeasurementTool';
import { linearHeatDensityLayers } from './components/tools/LinearHeatDensityTool';
import {
  communesFortPotentielPourCreationReseauxChaleurLayerColor,
  communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
  enrrMobilisablesGeothermieProfondeLayerColor,
  enrrMobilisablesGeothermieProfondeLayerOpacity,
  enrrMobilisablesThalassothermieLayerColor,
  enrrMobilisablesThalassothermieLayerOpacity,
  installationsGeothermieProfondeLayerColor,
  installationsGeothermieProfondeLayerOpacity,
  installationsGeothermieSurfaceEchangeursFermesDeclareeColor,
  installationsGeothermieSurfaceEchangeursFermesOpacity,
  installationsGeothermieSurfaceEchangeursFermesRealiseeColor,
  installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor,
  installationsGeothermieSurfaceEchangeursOuvertsOpacity,
  installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor,
} from './map-styles';

export const tileSourcesMaxZoom = 17;

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

export const selectableLayers = [
  {
    label: 'Les réseaux de chaleur existants',
    key: 'reseau_chaleur',
  },
  {
    label: 'Les réseaux de chaleur en construction',
    key: 'futur_reseau',
  },
  {
    label: 'Les périmètres de développement prioritaire',
    key: 'pdp',
  },
  {
    label: 'Les réseaux de froid',
    key: 'reseau_froid',
  },
] as const;

export type LegendURLKey = (typeof selectableLayers)[number]['key'];

export const mapLegendFeatures = [
  'reseauxDeChaleur',
  'reseauxDeFroid',
  'reseauxEnConstruction',
  'zonesDeDeveloppementPrioritaire',
  'batimentsRaccordesReseauxChaleur',
  'batimentsRaccordesReseauxFroid',
] as const;

export type MapLegendFeature = (typeof mapLegendFeatures)[number];

export const legendURLKeyToLegendFeature: Record<LegendURLKey | string, MapLegendFeature> = {
  reseau_chaleur: 'reseauxDeChaleur',
  futur_reseau: 'reseauxEnConstruction',
  reseau_froid: 'reseauxDeFroid',
  pdp: 'zonesDeDeveloppementPrioritaire',
  raccordementsChaud: 'batimentsRaccordesReseauxChaleur',
  raccordementsFroid: 'batimentsRaccordesReseauxFroid',
};

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
const GAS_PROPERTY_CONSO: keyof GasSummary = 'conso_nb';
const GAS_PROPERTY_TYPE_GAS: keyof GasSummary = 'code_grand';
const arrColorFromDefTypeGas = [
  ...Object.entries(themeDefTypeGas).flatMap(([TypeGasName, styleObject]: [string, any]) => [TypeGasName, styleObject.color]),
] as [ExpressionInputType, ExpressionInputType, ...ExpressionInputType[]];

// --------------
// --- Energy ---
// --------------
const ENERGY_PROPERTY_NB_LOT: keyof EnergySummary = 'nb_logements';
const ENERGY_PROPERTY_TYPE_ENERGY: keyof EnergySummary = 'energie_utilisee';
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

const zoomOpacityTransitionAt10: DataDrivenPropertyValueSpecification<number> = [
  'interpolate',
  ['linear'],
  ['zoom'],
  10 + 0.2,
  0,
  10 + 0.2 + 1,
  1,
];

export type MapSourceLayersSpecification = {
  sourceId: SourceId;
  source: SourceSpecification;
  layers: (Omit<LayerSpecification, 'source' | 'source-layer' | 'filter'> & {
    id: string;
    'source-layer'?: string;
    layout?: LayerSpecification['layout'] & {
      'icon-image'?: LayerSymbolImage;
    };
    isVisible: (config: MapConfiguration) => boolean;
    filter?: (config: MapConfiguration) => FilterSpecification;
    hoverable?: boolean; // allows hover effect
  })[];
  // click events ?
  // shortcut to popups ?
};

export const mapLayers = [
  {
    sourceId: 'enrrMobilisables-zonesGeothermieProfonde',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-zonesGeothermieProfonde/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 11,
    },
    layers: [
      {
        id: 'enrrMobilisables-zonesGeothermieProfonde',
        type: 'fill',
        paint: {
          'fill-color': enrrMobilisablesGeothermieProfondeLayerColor,
          'fill-opacity': enrrMobilisablesGeothermieProfondeLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesGeothermieProfonde,
      },
    ],
  },
  {
    sourceId: 'zonesPotentielChaud',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielChaud/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielChaud',
        type: 'fill',
        paint: {
          'fill-color': themeDefZonePotentielChaud.fill.color,
          'fill-opacity': themeDefZonePotentielChaud.fill.opacity,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
      },
      {
        id: 'zonesPotentielChaud-contour',
        type: 'line',
        paint: {
          'line-color': themeDefZonePotentielChaud.fill.color,
          'line-width': 2,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
      },
    ],
  },

  {
    sourceId: 'zonesPotentielFortChaud',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielFortChaud/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielFortChaud',
        type: 'fill',
        paint: {
          'fill-color': themeDefZonePotentielFortChaud.fill.color,
          'fill-opacity': themeDefZonePotentielFortChaud.fill.opacity,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
      },
      {
        id: 'zonesPotentielFortChaud-contour',
        type: 'line',
        paint: {
          'line-color': themeDefZonePotentielFortChaud.fill.color,
          'line-width': 2,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
      },
    ],
  },

  {
    sourceId: 'besoinsEnChaleurIndustrieCommunes',
    source: {
      type: 'vector',
      tiles: ['/api/map/besoinsEnChaleurIndustrieCommunes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 11,
    },
    layers: [
      {
        id: 'besoinsEnChaleurIndustrieCommunes',
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
        isVisible: (config) => config.besoinsEnChaleurIndustrieCommunes,
      },
      {
        id: 'besoinsEnChaleurIndustrieCommunes-contour',
        type: 'line',
        paint: {
          'line-color': '#777777',
          'line-width': 1,
        },
        isVisible: (config) => config.besoinsEnChaleurIndustrieCommunes,
      },
    ],
  },

  {
    sourceId: 'zoneDP',
    source: {
      type: 'vector',
      tiles: ['/api/map/zoneDP/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'zonesDeDeveloppementPrioritaire',
        'source-layer': 'zoneDP',
        type: 'fill',
        paint: {
          'fill-color': themeDefZoneDP.fill.color,
          'fill-opacity': themeDefZoneDP.fill.opacity,
        },
        isVisible: (config) => config.zonesDeDeveloppementPrioritaire,
      },
    ],
  },

  {
    sourceId: 'futurNetwork',
    source: {
      type: 'vector',
      tiles: ['/api/map/futurNetwork/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxEnConstruction-zone',
        'source-layer': 'futurOutline',
        type: 'fill',
        paint: {
          'fill-color': themeDefHeatNetwork.futur.color,
          'fill-opacity': themeDefHeatNetwork.futur.opacity,
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], true], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
      },
      {
        id: 'reseauxEnConstruction-trace',
        'source-layer': 'futurOutline',
        ...outlineLayerStyle,
        paint: {
          ...outlineLayerStyle.paint,
          'line-color': themeDefHeatNetwork.futur.color,
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], false], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
        hoverable: true,
      },
    ],
  },

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
      },
    ],
  },

  {
    sourceId: 'buildings',
    source: {
      type: 'vector',
      tiles: ['/api/map/buildings/{z}/{x}/{y}'],
      maxzoom: tileSourcesMaxZoom,
    },
    layers: [
      {
        id: 'caracteristiquesBatiments',
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
        isVisible: (config) => config.caracteristiquesBatiments,
      },
    ],
  },

  {
    sourceId: 'enrrMobilisables-friches',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-friches/{z}/{x}/{y}'],
      promoteId: 'GmlID',
      maxzoom: tileSourcesMaxZoom,
    },
    layers: [
      {
        id: 'enrrMobilisables-friches',
        type: 'fill',
        paint: {
          'fill-color': themeDefSolaireThermiqueFriches.color,
          'fill-opacity': themeDefSolaireThermiqueFriches.opacity,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches,
      },
      {
        id: 'enrrMobilisables-friches-contour',
        type: 'line',
        paint: {
          'line-color': themeDefSolaireThermiqueFriches.color,
          'line-width': 2,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches,
      },
    ],
  },

  {
    sourceId: 'enrrMobilisables-parkings',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-parkings/{z}/{x}/{y}'],
      promoteId: 'GmlID',
      maxzoom: tileSourcesMaxZoom,
    },
    layers: [
      {
        id: 'enrrMobilisables-parkings',
        type: 'fill',
        paint: {
          'fill-color': themeDefSolaireThermiqueParkings.color,
          'fill-opacity': themeDefSolaireThermiqueParkings.opacity,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
      },
      {
        id: 'enrrMobilisables-parkings-contour',
        type: 'line',
        paint: {
          'line-color': themeDefSolaireThermiqueParkings.color,
          'line-width': 2,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
      },
    ],
  },

  {
    sourceId: 'enrrMobilisables-thalassothermie',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-thalassothermie/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 12,
    },
    layers: [
      {
        id: 'enrrMobilisables-thalassothermie',
        type: 'fill',
        paint: {
          'fill-color': enrrMobilisablesThalassothermieLayerColor,
          'fill-opacity': enrrMobilisablesThalassothermieLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesThalassothermie,
      },
    ],
  },

  {
    sourceId: 'batimentsRaccordesReseauxChaleurFroid',
    source: {
      type: 'vector',
      tiles: [`/api/map/batimentsRaccordesReseauxChaleurFroid/{z}/{x}/{y}`],
      minzoom: 9,
      maxzoom: 13, // 13 permet de cliquer jusqu'au zoom 20 inclus, sinon maplibre ne considère pas la feature comme cliquable
    },
    layers: [
      {
        id: 'batimentsRaccordesReseauxChaleur',
        'source-layer': 'batiments_raccordes_reseaux_chaleur',
        minzoom: 9,
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.1, 12, 0.5],
        },
        paint: {
          'icon-color': themeDefHeatNetwork.classed.color,
          'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9.2, 0, 10.5, batimentsRaccordesLayerMaxOpacity],
        },
        isVisible: (config) => config.batimentsRaccordesReseauxChaleur,
      },
      {
        id: 'batimentsRaccordesReseauxFroid',
        'source-layer': 'batiments_raccordes_reseaux_froid',
        minzoom: 9,
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.1, 12, 0.5],
        },
        paint: {
          'icon-color': themeDefHeatNetwork.cold.color,
          'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9.2, 0, 10.5, batimentsRaccordesLayerMaxOpacity],
        },
        isVisible: (config) => config.batimentsRaccordesReseauxFroid,
      },
    ],
  },

  {
    sourceId: 'energy',
    source: {
      type: 'vector',
      tiles: [`/api/map/energy/{z}/{x}/{y}`],
      maxzoom: tileSourcesMaxZoom,
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
            ['<', ['get', ENERGY_PROPERTY_NB_LOT], LegendDeskData.energy.min],
            getSymbolRatio(minIconSize),
            ['<', ['get', ENERGY_PROPERTY_NB_LOT], LegendDeskData.energy.max],
            [
              'interpolate',
              ['linear'],
              ['get', ENERGY_PROPERTY_NB_LOT],
              LegendDeskData.energy.min,
              getSymbolRatio(minIconSize),
              LegendDeskData.energy.max,
              getSymbolRatio(maxIconSize),
            ],
            getSymbolRatio(maxIconSize),
          ],
        },
        paint: {
          'icon-color': ['match', ['get', ENERGY_PROPERTY_TYPE_ENERGY], ...arrColorFromDefEnergy, themeDefEnergy.unknow.color],
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
        filter: (config) => {
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

  {
    sourceId: 'gas',
    source: {
      type: 'vector',
      tiles: [`/api/map/gas/{z}/{x}/{y}`],
      maxzoom: tileSourcesMaxZoom,
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
          'circle-color': ['match', ['get', GAS_PROPERTY_TYPE_GAS], ...arrColorFromDefTypeGas, themeDefTypeGas.unknow.color],
          'circle-radius': [
            'case',
            ['<', ['get', GAS_PROPERTY_CONSO], LegendDeskData.gasUsage.min],
            minIconSize / 2,
            ['<', ['get', GAS_PROPERTY_CONSO], LegendDeskData.gasUsage.max],
            [
              'interpolate',
              ['linear'],
              ['get', GAS_PROPERTY_CONSO],
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
        filter: (config) => {
          const consommationsGazIntervalMin =
            config.consommationsGaz.interval[0] === LegendDeskData.gasUsage.min
              ? Number.MIN_SAFE_INTEGER
              : config.consommationsGaz.interval[0];
          const consommationsGazIntervalMax =
            config.consommationsGaz.interval[1] === LegendDeskData.gasUsage.max
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

  {
    sourceId: 'demands',
    source: {
      type: 'vector',
      tiles: [`/api/map/demands/{z}/{x}/{y}`],
      maxzoom: tileSourcesMaxZoom,
    },
    layers: [
      {
        id: 'demandesEligibilite',
        'source-layer': 'demands',
        type: 'circle',
        paint: {
          'circle-color': themeDefDemands.fill.color,
          'circle-stroke-color': themeDefDemands.stroke.color,
          'circle-radius': themeDefDemands.fill.size,
          'circle-stroke-width': themeDefDemands.stroke.size,
        },
        isVisible: (config) => config.demandesEligibilite,
      },
    ],
  },

  {
    sourceId: 'network',
    source: {
      type: 'vector',
      tiles: ['/api/map/network/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxDeChaleur-avec-trace',
        ...outlineLayerStyle,
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeChaleur.show,
        hoverable: true,
      },
      {
        id: 'reseauxDeChaleur-sans-trace',
        ...outlineCenterLayerStyle,
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeChaleur.show,
      },
    ],
  },

  {
    sourceId: 'coldNetwork',
    source: {
      type: 'vector',
      tiles: ['/api/map/coldNetwork/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxDeFroid-avec-trace',
        'source-layer': 'coldOutline',
        ...outlineLayerStyle,
        paint: {
          ...outlineLayerStyle.paint,
          'line-color': themeDefHeatNetwork.cold.color,
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeFroid,
        hoverable: true,
      },
      {
        id: 'reseauxDeFroid-sans-trace',
        'source-layer': 'coldOutline',
        ...outlineCenterLayerStyle,
        paint: {
          ...outlineCenterLayerStyle.paint,
          'circle-stroke-color': themeDefHeatNetwork.cold.color,
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeFroid,
      },
    ],
  },

  {
    sourceId: 'enrrMobilisables',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables/{z}/{x}/{y}'],
      maxzoom: tileSourcesMaxZoom,
      promoteId: 'GmlID',
    },

    // the source contains one layer that contains all features
    // we know the kind of one feature using the GmlID (e.g. datacenter.1)
    // we have 5 layers, one for each kind of features to simplify show/hide code
    layers: [
      {
        id: 'enrrMobilisables-stations-d-epuration',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_stations_epuration',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'stations_d_epuration', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showStationsDEpuration,
      },
      {
        id: 'enrrMobilisables-datacenter',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_datacenter',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'datacenter', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showDatacenters,
      },
      {
        id: 'enrrMobilisables-industrie',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_industrie',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'industrie', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showIndustrie,
      },
      {
        id: 'enrrMobilisables-installations-electrogenes',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_installations_electrogenes',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'installations_electrogenes', ['get', 'GmlID']],
        isVisible: (config) =>
          config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showInstallationsElectrogenes,
      },
      {
        id: 'enrrMobilisables-unites-d-incineration',
        type: 'symbol',
        layout: {
          'icon-image': 'enrr_mobilisables_unites_incineration',
          'icon-overlap': 'always',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
        },

        filter: () => ['in', 'unites_d_incineration', ['get', 'GmlID']],
        isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale.showUnitesDIncineration,
      },
    ],
  },

  {
    sourceId: 'installationsGeothermieProfonde',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieProfonde/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 6,
    },
    layers: [
      {
        id: 'installationsGeothermieProfonde',
        type: 'circle',
        paint: {
          'circle-color': installationsGeothermieProfondeLayerColor,
          'circle-radius': 8,
          'circle-opacity': installationsGeothermieProfondeLayerOpacity,
        },
        isVisible: (config) => config.installationsGeothermieProfonde,
      },
    ],
  },
  {
    sourceId: 'installationsGeothermieSurfaceEchangeursFermes',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieSurfaceEchangeursFermes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'installationsGeothermieSurfaceEchangeursFermes',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'statut_inst'], 'Déclaré'],
            installationsGeothermieSurfaceEchangeursFermesDeclareeColor,
            installationsGeothermieSurfaceEchangeursFermesRealiseeColor,
          ],
          'circle-radius': 8,
          'circle-opacity': installationsGeothermieSurfaceEchangeursFermesOpacity,
        },
        isVisible: (config) => config.installationsGeothermieSurfaceEchangeursFermes,
      },
    ],
  },
  {
    sourceId: 'installationsGeothermieSurfaceEchangeursOuverts',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieSurfaceEchangeursOuverts/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'installationsGeothermieSurfaceEchangeursOuverts',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'statut_inst'], 'Déclaré'],
            installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor,
            installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor,
          ],
          'circle-radius': 8,
          'circle-opacity': installationsGeothermieSurfaceEchangeursOuvertsOpacity,
        },
        isVisible: (config) => config.installationsGeothermieSurfaceEchangeursOuverts,
      },
    ],
  },

  {
    sourceId: 'communesFortPotentielPourCreationReseauxChaleur',
    source: {
      type: 'vector',
      tiles: ['/api/map/communesFortPotentielPourCreationReseauxChaleur/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 6,
    },
    layers: [
      {
        id: 'communesFortPotentielPourCreationReseauxChaleur',
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
        filter: (config) => [
          'all',
          ['>=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[0]],
          ['<=', ['get', 'population'], config.communesFortPotentielPourCreationReseauxChaleur.population[1]],
        ],
        isVisible: (config) => config.communesFortPotentielPourCreationReseauxChaleur.show,
      },
    ],
  },

  // other sources: distances measurement, linear heat density, buildings data extraction
  ...distancesMeasurementLayers,
  ...linearHeatDensityLayers,
  ...buildingsDataExtractionLayers,
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

export type LayerId = (typeof mapLayers)[number]['layers'][number]['id'];

// extends the Map type to get fully typed layer and source ids
interface FCUMap extends Map {
  getLayer(id: LayerId): ReturnType<Map['getLayer']>;
  setLayoutProperty(layerId: LayerId, name: string, value: any, options?: StyleSetterOptions): this;

  setFilter(layerId: LayerId, filter?: FilterSpecification | null, options?: StyleSetterOptions): this;
}

export function loadMapLayers(map: FCUMap, config: MapConfiguration) {
  mapLayers.forEach((spec) => {
    if (map.getSource(spec.sourceId)) {
      return;
    }

    map.addSource(spec.sourceId, {
      ...spec.source,
      // prepend the website origin to the tiles as we need the full url for tiles
      ...(spec.source.type === 'vector' && isDefined(spec.source.tiles)
        ? { tiles: spec.source.tiles.map((url) => `${clientConfig.websiteOrigin}${url}`) }
        : {}),
    });
    spec.layers.forEach((layer) => {
      map.addLayer({
        source: spec.sourceId,
        ...(spec.source.type === 'vector'
          ? {
              'source-layer': 'layer', // default source layer name
            }
          : {}),
        ...layer,
        layout: deepMergeObjects((layer as any).layout ?? {}, {
          visibility: layer.isVisible(config) ? 'visible' : 'none',
        }),
        ...(('filter' satisfies keyof MapSourceLayersSpecification['layers'][number]) in layer
          ? {
              filter: layer.filter(config),
            }
          : {}),
      } as any);
    });
  });
}

/**
 * Apply the map configuration to the map layers.
 */
export function applyMapConfigurationToLayers(map: FCUMap, config: MapConfiguration) {
  mapLayers
    .flatMap((source) => source.layers as ReadonlyArray<(typeof mapLayers)[number]['layers'][number]>)
    .forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        console.warn(`Layer '${layer.id}' is not set on map`);
        return;
      }

      map.setLayoutProperty(layer.id, 'visibility', layer.isVisible(config) ? 'visible' : 'none');
      if (('filter' satisfies keyof MapSourceLayersSpecification['layers'][number]) in layer) {
        map.setFilter(layer.id, layer.filter(config));
      }
    });
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
    confKey: 'contenuCO2',
    valueKey: 'contenu CO2',
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
    ...(isDefined(conf.isClassed) ? [['==', ['get', 'reseaux classes'], conf.isClassed] satisfies ExpressionSpecification] : []),
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
  if ((filtreGestionnaire || []).length === 0) {
    return [];
  }

  if (filtreGestionnaire.includes('autre')) {
    const gestionnairesToExclude = gestionnairesFilters
      .filter(({ value }) => !filtreGestionnaire.includes(value))
      .map(({ value }) => value);

    return [
      [
        'all',
        ...gestionnairesToExclude.flatMap(
          (filtre) =>
            [
              [
                '!',
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'gestionnaire'], '']], // futurNetwork
                ],
              ],
              [
                '!',
                [
                  'in',
                  filtre,
                  ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']], // coldNetwork and network,
                ],
              ],
            ] satisfies ExpressionSpecification[]
        ),
      ],
    ];
  }

  return (filtreGestionnaire || []).length > 0
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
