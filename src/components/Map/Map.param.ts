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
  substation: false,
  boilerRoom: false,
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
  'separator',
  {
    id: 'gasUsageGroup',
    title: 'Gaz :',
    entries: [
      {
        id: 'gasUsageGroup',
        label: 'Consommations de gaz',
        description: 'Source : Données locales de l’énergie, MTE',
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
        label: localTypeEnergy?.gas || localTypeEnergy.unknow,
        description: 'Source : Registre national des copropriétés',
        bgColor: themeDefEnergy.gas.color,
      },
    ],
    subLegend: 'EnergyGas',
    type: 'group',
  },
  'separator',
  {
    id: 'energy',
    title: 'Fioul :',
    entries: [
      {
        id: 'fuelOil',
        label: localTypeEnergy?.fuelOil || localTypeEnergy.unknow,
        description: 'Source : Registre national des copropriétés',
        bgColor: themeDefEnergy.fuelOil.color,
      },
    ],
    subLegend: 'EnergyFuel',
    type: 'group',
  },
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
