import { ReseauxDeChaleurLimits } from '@components/Map/map-layers';
import { Interval } from '@utils/interval';
import { EnergieRatioConfKey, FiltreEnergieConfKey } from 'src/services/Map/map-configuration';

const defaultInterval: Interval = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
const percentageMaxInterval: Interval = [0, 100];

export type FilterLimits = {
  livraisons_totale_MWh: Interval;
  'Taux EnR&R': Interval;
  'contenu CO2 ACV': Interval;
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
  rdcLimitKey?: keyof ReseauxDeChaleurLimits;
};

export const emptyFilterLimits: FilterLimits = {
  'Taux EnR&R': defaultInterval,
  'contenu CO2 ACV': defaultInterval,
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
