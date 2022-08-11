import {
  localTypeEnergy,
  localTypeGas,
  themeDefEnergy,
  themeDefTypeGas,
} from './businessRules';

const defaultPos = [48.85294, 2.34987]; // Default to Paris IDF

export type TypeLayerDisplay = Record<string, any> & {
  gasUsage: string[];
  energy: string[];
};

const defaultLayerDisplay: TypeLayerDisplay = {
  outline: true,
  zoneDP: true,
  demands: true,
  gasUsageGroup: true,
  gasUsage: ['R', 'T'],
  energy: ['fuelOil', 'gas'],
};

const legendData = [
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
        label: 'Consommations globale de gaz',
        bgColor: 'red',
      },
    ],
    type: 'group',
  },
  {
    id: 'gasUsage',
    entries: defaultLayerDisplay.gasUsage.map((id: string) => ({
      id,
      label: localTypeGas?.[id] || localTypeGas.unknow,
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
