import { Interval } from '@utils/interval';
import { EnergieRatioConfKey, FiltreEnergieConfKey } from 'src/services/Map/map-configuration';

const defaultInterval: Interval = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
const percentageMaxInterval: Interval = [0, 100];

export type FilterLimits = {
  livraisons_totale_MWh: Interval;
  'Taux EnR&R': Interval;
  'contenu CO2 ACV': Interval;
  'contenu CO2': Interval;
  PM: Interval;
  annee_creation: Interval;
} & Record<EnergieRatioConfKey, Interval>;

export type FilterNoLimits = {
  energieMajoritaire: FiltreEnergieConfKey | string;
  gestionnaire: string;
  isClassed: boolean;
  region: string;
};

export type FilterValues = FilterLimits & FilterNoLimits;

export type IntervalAndEnergiesFilters = {
  label: string;
  confKey: keyof FilterLimits;
  limitKey?: string;
};

export const emptyFilterLimits: FilterLimits = {
  'Taux EnR&R': defaultInterval,
  'contenu CO2 ACV': defaultInterval,
  'contenu CO2': defaultInterval,
  PM: defaultInterval,
  livraisons_totale_MWh: defaultInterval,
  annee_creation: defaultInterval,
  energie_ratio_biomasse: percentageMaxInterval,
  energie_ratio_geothermie: percentageMaxInterval,
  energie_ratio_uve: percentageMaxInterval,
  energie_ratio_chaleurIndustrielle: percentageMaxInterval,
  energie_ratio_solaireThermique: percentageMaxInterval,
  energie_ratio_pompeAChaleur: percentageMaxInterval,
  energie_ratio_gaz: percentageMaxInterval,
  energie_ratio_fioul: percentageMaxInterval,
};

export const emptyFilterNoLimits: FilterNoLimits = {
  energieMajoritaire: '',
  gestionnaire: '',
  isClassed: false,
  region: '',
};

export const emptyFilterValues: FilterValues = {
  ...emptyFilterLimits,
  ...emptyFilterNoLimits,
};

export const intervalFilters = [
  {
    label: "Taux d'EnR&R",
    confKey: 'Taux EnR&R',
    limitKey: 'tauxENRR',
  },
  {
    label: 'Contenu CO2 ACV (gCO2/kWh)',
    confKey: 'contenu CO2 ACV',
    limitKey: 'contenuCO2ACV',
  },
  {
    label: 'Contenu CO2 (gCO2/kWh)',
    confKey: 'contenu CO2',
    limitKey: 'contenuCO2',
  },
  {
    label: 'Prix moyen de la chaleur (€TTC/MWh)',
    confKey: 'PM',
    limitKey: 'prixMoyen',
  },
  {
    label: 'Année de construction',
    confKey: 'annee_creation',
    limitKey: 'anneeConstruction',
  },
  {
    label: 'Livraisons de chaleur annuelles (GWh)',
    confKey: 'livraisons_totale_MWh',
    limitKey: 'livraisonsAnnuelles',
  },
] as const satisfies ReadonlyArray<IntervalAndEnergiesFilters>;

export type IntervalFiltersConfKey = (typeof intervalFilters)[number]['confKey'];
export type IntervalFiltersLimitKey = Record<(typeof intervalFilters)[number]['limitKey'], [min: number, max: number]>;

export const energiesFilters = [
  {
    label: 'Biomasse',
    confKey: 'energie_ratio_biomasse',
  },
  {
    label: 'Géothermie',
    confKey: 'energie_ratio_geothermie',
  },
  {
    label: 'UVE',
    confKey: 'energie_ratio_uve',
  },
  {
    label: 'Chaleur industrielle',
    confKey: 'energie_ratio_chaleurIndustrielle',
  },
  {
    label: 'Solaire thermique',
    confKey: 'energie_ratio_solaireThermique',
  },
  {
    label: 'Pompe à chaleur',
    confKey: 'energie_ratio_pompeAChaleur',
  },
  {
    label: 'Gaz',
    confKey: 'energie_ratio_gaz',
  },
  {
    label: 'Fioul',
    confKey: 'energie_ratio_fioul',
  },
] as const satisfies ReadonlyArray<IntervalAndEnergiesFilters>;
