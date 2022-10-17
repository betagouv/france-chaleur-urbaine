import { TypeGroupLegend } from 'src/types/TypeGroupLegend';
import {
  localTypeEnergy,
  localTypeGas,
  themeDefEnergy,
  themeDefTypeGas,
} from './businessRules';

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
        label: 'Périmètres de développement prioritaire',
        info: "Dans cette zone, le raccordement des nouvelles constructions ou des bâtiments renouvelant leur installation de chauffage au-dessus d'une certaine puissance est obligatoire",
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
        label: 'Caractéristiques des bâtiments',
        subLegend: 'DPE',
        info: "Les DPE affichés par bâtiment résultent d'un extrapolation des DPE par logement ancienne définition. Ils sont donnés à titre informatif et non-officiel, sans aucune valeur légale.",
      },
    ],
    type: 'list',
  },
  'separator',
  'sources',
];

const param = {
  minZoomData: 13,
  minZoom: 4,
  maxZoom: 17,
  defaultZoom: 4,
  lng: 2.3,
  lat: 45,
  defaultLayerDisplay,
  legendData,
};

export default param;
