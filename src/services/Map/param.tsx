import { TypeGroupLegend } from 'src/types/TypeGroupLegend';
import { LegendGroupId } from 'src/types/enum/LegendGroupId';
import {
  localTypeEnergy,
  localTypeGas,
  themeDefEnergy,
  themeDefTypeGas,
} from './businessRules';

enum Layer {
  outline = 'outline',
  futurOutline = 'futurOutline',
  coldOutline = 'coldOutline',
  demands = 'demands',
  zoneDP = 'zoneDP',
  buildings = 'buildings',
  raccordements = 'raccordements',
  zonesPotentielChaud = 'zonesPotentielChaud',
  zonesPotentielFortChaud = 'zonesPotentielFortChaud',
}

export const layerNameOptions = Object.values(Layer);
const energyNameOptions: ('gas' | 'fuelOil')[] = ['fuelOil', 'gas'];
const gasUsageNameOptions = ['R', 'T', 'I'];

export type LayerNameOption = (typeof layerNameOptions)[number];
export type EnergyNameOption = (typeof energyNameOptions)[number];
export type gasUsageNameOption = (typeof gasUsageNameOptions)[number];

export type TypeLayerDisplay = {
  outline: boolean;
  futurOutline: boolean;
  coldOutline: boolean;
  zoneDP: boolean;
  demands: boolean;
  raccordements: boolean;
  gasUsageGroup: boolean;
  buildings: boolean;
  zonesPotentielChaud: boolean;
  zonesPotentielFortChaud: boolean;
  gasUsage: string[];
  energy: ('gas' | 'fuelOil')[];
  gasUsageValues: [number, number];
  energyGasValues: [number, number];
  energyFuelValues: [number, number];
};

export const defaultLayerDisplay: TypeLayerDisplay = {
  outline: true,
  futurOutline: true,
  coldOutline: false,
  zoneDP: false,
  demands: false,
  raccordements: false,
  gasUsageGroup: true,
  buildings: false,
  zonesPotentielChaud: false,
  zonesPotentielFortChaud: false,
  gasUsage: gasUsageNameOptions,
  energy: energyNameOptions,
  gasUsageValues: [1000, Number.MAX_VALUE],
  energyGasValues: [50, Number.MAX_VALUE],
  energyFuelValues: [50, Number.MAX_VALUE],
};

export const simpleLayerDisplay: TypeLayerDisplay = {
  outline: true,
  futurOutline: true,
  coldOutline: false,
  zoneDP: false,
  demands: false,
  raccordements: false,
  gasUsageGroup: false,
  buildings: false,
  zonesPotentielChaud: false,
  zonesPotentielFortChaud: false,
  gasUsage: [],
  energy: [],
  gasUsageValues: [1000, Number.MAX_VALUE],
  energyGasValues: [50, Number.MAX_VALUE],
  energyFuelValues: [50, Number.MAX_VALUE],
};

export const iframeSimpleLayerDisplay: TypeLayerDisplay = {
  outline: true,
  futurOutline: false,
  coldOutline: false,
  zoneDP: false,
  demands: false,
  raccordements: false,
  gasUsageGroup: false,
  buildings: false,
  zonesPotentielChaud: false,
  zonesPotentielFortChaud: false,
  gasUsage: [],
  energy: [],
  gasUsageValues: [1000, Number.MAX_VALUE],
  energyGasValues: [50, Number.MAX_VALUE],
  energyFuelValues: [50, Number.MAX_VALUE],
};

const legendData: (string | TypeGroupLegend)[] = [
  {
    id: LegendGroupId.heatNetwork,
    entries: [
      {
        id: 'outline',
        subLegend: 'RDC',
        info: (
          <>
            Pour les réseaux classés, le raccordement des bâtiments neufs ou
            renouvelant leur installation de chauffage au-dessus d'une certaine
            puissance est obligatoire dès lors qu'ils sont situés dans le
            périmètre de développement prioritaire (sauf dérogation).
            <br />
            Les réseaux affichés comme classés sont ceux listés par arrêté du 22
            décembre 2023. Collectivités : pour signaler un dé-classement,
            cliquez sur Contribuer.
          </>
        ),
        infoPosition: 'bottom',
        trackingEvent: 'Carto|Réseaux chaleur',
      },
    ],
    type: 'list',
  },
  {
    id: LegendGroupId.zoneDP,
    entries: [
      {
        id: 'zoneDP',
        label: 'Périmètres de développement prioritaire des réseaux classés',
        className: 'legend-zoneDP',
        info: "Dans cette zone, le raccordement des nouvelles constructions ou des bâtiments renouvelant leur installation de chauffage au-dessus d'une certaine puissance est obligatoire",
        infoPosition: 'bottom',
        trackingEvent: 'Carto|Périmètres de développement prioritaire',
      },
    ],
    type: 'list',
  },
  {
    id: LegendGroupId.futurheatNetwork,
    entries: [
      {
        id: 'futurOutline',
        subLegend: 'FuturRDC',
        info: "Projets financés par l'ADEME ou signalés par les collectivités et exploitants.",
        infoPosition: 'bottom',
        trackingEvent: 'Carto|Réseaux en construction',
      },
    ],
    type: 'list',
  },
  {
    id: LegendGroupId.coldNetwork,
    entries: [
      {
        id: 'coldOutline',
        subLegend: 'RDCold',
        className: 'legend-cold-network',
        trackingEvent: 'Carto|Réseaux de froid',
      },
    ],
    type: 'list',
  },
  'contributeButton',
  'separator',
  {
    id: LegendGroupId.demands,
    entries: [
      {
        id: 'demands',
        label: 'Demandes de raccordement sur France Chaleur Urbaine',
        className: 'legend-demands',
        trackingEvent: 'Carto|Demandes de raccordement',
      },
    ],
    type: 'list',
  },
  'separator',
  'statsByArea',
  'separator',
  {
    id: LegendGroupId.gasUsageGroup,
    entries: [
      {
        id: 'gasUsageGroup',
        label: 'Consommations globales de gaz',
        bgColor: 'red',
        trackingEvent: 'Carto|Consommations globales de gaz',
      },
    ],
    type: 'group',
  },
  {
    id: LegendGroupId.gasUsage,
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
    id: LegendGroupId.energy,
    entries: [
      {
        id: 'gas',
        label: localTypeEnergy.gas,
        bgColor: themeDefEnergy.gas.color,
        trackingEvent: 'Carto|Bâtiments au gaz collectif',
      },
    ],
    subLegend: 'EnergyGas',
    type: 'group',
  },
  'separator',
  {
    id: LegendGroupId.energy,
    entries: [
      {
        id: 'fuelOil',
        label: localTypeEnergy.fuelOil,
        bgColor: themeDefEnergy.fuelOil.color,
        trackingEvent: 'Carto|Bâtiments au fioul collectif',
      },
    ],
    subLegend: 'EnergyFuel',
    type: 'group',
  },
  'separator',
  {
    id: LegendGroupId.raccordements,
    entries: [
      {
        id: 'raccordements',
        label: 'Bâtiments raccordés à un réseau de chaleur',
        className: 'legend-raccordements',
        trackingEvent: 'Carto|Bâtiments raccordés',
      },
    ],
    type: 'list',
  },
  'separator',
  {
    id: LegendGroupId.zonesPotentielChaud,
    entries: [
      {
        id: 'zonesPotentielChaud',
        label: "Zones d'opportunité à potentiel chaud",
        className: 'legend-zonesPotentielChaud',
        trackingEvent: 'Carto|Zones à potentiel chaud',
      },
    ],
    type: 'list',
  },
  {
    id: LegendGroupId.zonesPotentielFortChaud,
    entries: [
      {
        id: 'zonesPotentielFortChaud',
        label: "Zones d'opportunité à potentiel fort chaud",
        className: 'legend-zonesPotentielFortChaud',
        trackingEvent: 'Carto|Zones à potentiel fort chaud',
      },
    ],
    type: 'list',
  },
  'separator',
  {
    id: LegendGroupId.buildings,
    entries: [
      {
        id: 'buildings',
        label: 'Caractéristiques des bâtiments',
        subLegend: 'DPE',
        info: "Les DPE affichés par bâtiment résultent d'un extrapolation des DPE par logement ancienne définition. Ils sont donnés à titre informatif et non-officiel, sans aucune valeur légale.",
        trackingEvent: 'Carto|DPE',
      },
    ],
    type: 'list',
  },
  'proModeLegend',
  'separator',
  'sources',
];

const param = {
  minZoomData: 12,
  minZoom: 5,
  maxZoom: 17.9,
  defaultZoom: 5,
  lng: 2.3,
  lat: 47,
  defaultLayerDisplay,
  simpleLayerDisplay,
  iframeSimpleLayerDisplay,
  legendData,
};

export default param;
