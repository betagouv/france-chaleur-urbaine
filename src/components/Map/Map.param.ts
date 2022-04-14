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
  substation: true,
  boilerRoom: true,
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
      {
        id: 'boilerRoom',
        label: 'Chaufferie',
        className: 'legend-boiler-room',
      },
      {
        id: 'substation',
        label: 'Sous station',
        className: 'legend-substation',
      },
    ],
    type: 'list',
  },
  'separator',
  {
    id: 'energy',
    title: 'Copropriétés\u00a0: type de chauffage',
    entries: defaultLayerDisplay.energy.map((id: string) => ({
      id,
      label: localTypeEnergy?.[id] || localTypeEnergy.unknow,
      bgColor: themeDefEnergy[id].color,
      className: 'legend-energy',
    })),
    description: 'Energy',
    type: 'group',
  },
  {
    id: 'gasUsage',
    title: 'Consommations de gaz',
    entries: defaultLayerDisplay.gasUsage.map((id: string) => ({
      id,
      label: localTypeGas?.[id] || localTypeGas.unknow,
      bgColor: themeDefTypeGas[id].color,
      className: 'legend-energy',
    })),
    description: 'GasUsage',
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
