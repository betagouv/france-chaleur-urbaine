import {
  localTypeEnergy,
  localTypeGas,
  themeDefEnergy,
  themeDefTypeGas,
} from './businessRules';
import { TypeGroupLegend } from './components/LegendGroupLabel';

const defaultPos = [48.85294, 2.34987]; // Default to Paris IDF

enum Layer {
  outline = 'outline',
  demands = 'demands',
  zoneDP = 'zoneDP',
  buildings = 'buildings',
}

export const layerNameOptions = Object.values(Layer);
const energyNameOptions = ['fuelOil', 'gas'];
const gasUsageNameOptions = ['R', 'T', 'I'];

export type LayerNameOption = typeof layerNameOptions[number];
export type EnergyNameOption = typeof energyNameOptions[number];
export type gasUsageNameOption = typeof gasUsageNameOptions[number];

export type TypeLayerDisplay = Record<string, boolean | string[]> & {
  gasUsage: string[];
  energy: string[];
};

const defaultLayerDisplay: TypeLayerDisplay = {
  outline: true,
  zoneDP: false,
  demands: true,
  gasUsageGroup: true,
  buildings: false,
  gasUsage: gasUsageNameOptions,
  energy: energyNameOptions,
};

const legendData: (string | TypeGroupLegend)[] = [
  {
    id: 'heat-network',
    entries: [
      {
        id: 'outline',
        label: 'Réseaux de chaleur',
        className: 'legend-heat-network',
      },
    ],
    type: 'list',
  },
  {
    id: 'zoneDP',
    entries: [
      {
        id: 'zoneDP',
        label: 'Zones de développement prioritaires',
        info: "Dans cette zone, le raccordement des nouvelles constructions ou des bâtiments renouvelant leur installation de chauffage au dessus d'une puissance de 30 kW est obligatoire",
        className: 'legend-zoneDP',
      },
    ],
    type: 'list',
  },
  'contributeButton',
  'separator',
  {
    id: 'demands',
    entries: [
      {
        id: 'demands',
        label: 'Demandes de raccordement sur France Chaleur Urbaine',
        className: 'legend-demands',
      },
    ],
    type: 'list',
  },
  'separator',
  {
    id: 'gasUsageGroup',
    entries: [
      {
        id: 'gasUsageGroup',
        label: 'Consommations globales de gaz',
        bgColor: 'red',
      },
    ],
    type: 'group',
  },
  {
    id: 'gasUsage',
    entries: defaultLayerDisplay.gasUsage.map((id: string) => ({
      id,
      label: localTypeGas[id] || localTypeGas.unknow,
      bgColor: themeDefTypeGas[id].color,
      className: 'legend-energy',
    })),
    subLegend: 'GasUsage',
    type: 'group',
    subGroup: true,
    linkto: ['gasUsageGroup'],
  },
  {
    id: 'energy',
    entries: [
      {
        id: 'gas',
        label: localTypeEnergy.gas,
        bgColor: themeDefEnergy.gas.color,
      },
    ],
    subLegend: 'EnergyGas',
    type: 'group',
  },
  'separator',
  {
    id: 'energy',
    entries: [
      {
        id: 'fuelOil',
        label: localTypeEnergy.fuelOil,
        bgColor: themeDefEnergy.fuelOil.color,
      },
    ],
    subLegend: 'EnergyFuel',
    type: 'group',
  },
  'separator',
  {
    id: 'buildings',
    entries: [
      {
        id: 'buildings',
        label: 'Autres données sur les bâtiments',
        subLegendTxt:
          'Cliquer sur le bâtiment souhaité pour obtenir plus d’informations',
      },
    ],
    type: 'list',
  },
  'separator',
  'sources',
];

const param = {
  minZoomData: 12.75,
  minZoom: 4,
  maxZoom: 22,
  defaultZoom: 12,
  lng: defaultPos[1],
  lat: defaultPos[0],
  defaultLayerDisplay,
  legendData,
};

export default param;
