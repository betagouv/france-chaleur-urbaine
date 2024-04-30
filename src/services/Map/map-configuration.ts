import { deepMergeObjects } from '@utils/core';
import { Interval } from '@utils/interval';
import { DeepPartial, FlattenKeys } from '@utils/typescript';

type FiltreEnergie = {
  label: string;
  confKey: string;
};

export const filtresEnergies = [
  {
    label: 'Biomasse',
    confKey: 'biomasse',
  },
  {
    label: 'Géothermie',
    confKey: 'geothermie',
  },
  {
    label: 'UVE',
    confKey: 'uve',
  },
  {
    label: 'Chaleur industrielle',
    confKey: 'chaleurIndustrielle',
  },
  {
    label: 'Solaire thermique',
    confKey: 'solaireThermique',
  },
  {
    label: 'Pompe à chaleur',
    confKey: 'pompeAChaleur',
  },
  {
    label: 'Gaz',
    confKey: 'gaz',
  },
  {
    label: 'Fioul',
    confKey: 'fioul',
  },
] as const satisfies ReadonlyArray<FiltreEnergie>;

export type FiltreEnergieConfKey = (typeof filtresEnergies)[number]['confKey'];

type EnergieRatioConfKey = `energie_ratio_${FiltreEnergieConfKey}`;

export type MapConfiguration = {
  proMode: boolean;
  filtreIdentifiantReseau: string[];
  filtreGestionnaire: string[];
  reseauxDeChaleur: {
    show: boolean;
    energieMajoritaire?: FiltreEnergieConfKey;
    tauxENRR: Interval;
    emissionsCO2: Interval;
    prixMoyen: Interval;
    anneeConstruction: Interval;
    limits: {
      tauxENRR: Interval;
      emissionsCO2: Interval;
      prixMoyen: Interval;
      anneeConstruction: Interval;
    };
  } & Record<EnergieRatioConfKey, Interval>;
  reseauxDeFroid: boolean;
  reseauxEnConstruction: boolean;
  zonesDeDeveloppementPrioritaire: boolean;
  demandesEligibilite: boolean;
  consommationsGaz: {
    show: boolean;
    logements: boolean;
    tertiaire: boolean;
    industrie: boolean;
    interval: Interval;
  };
  batimentsGazCollectif: {
    show: boolean;
    interval: Interval;
  };
  batimentsFioulCollectif: {
    show: boolean;
    interval: Interval;
  };
  batimentsRaccordes: boolean;
  enrrMobilisables: {
    show: boolean;
    showDatacenters: boolean;
    showIndustrie: boolean;
    showInstallationsElectrogenes: boolean;
    showStationsDEpuration: boolean;
    showUnitesDIncineration: boolean;
    showSolaireThermiqueFriches: boolean;
    showSolaireThermiqueParkings: boolean;
  };
  zonesOpportunite: {
    show: boolean;
    zonesPotentielChaud: boolean;
    zonesPotentielFortChaud: boolean;
  };
  caracteristiquesBatiments: boolean;
};

/**
 * Map configuration qui doit être complétée dynamiquement avec les limites
 * des réseaux de chaleur, afin de construire les limites pour les filtres.
 */
export type EmptyMapConfiguration = Omit<
  MapConfiguration,
  'reseauxDeChaleur'
> & {
  reseauxDeChaleur: Omit<MapConfiguration['reseauxDeChaleur'], 'limits'> & {
    limits: null;
  };
};

export type MaybeEmptyMapConfiguration =
  | MapConfiguration
  | EmptyMapConfiguration;

export type MapConfigurationProperty = FlattenKeys<MapConfiguration>;

export function isMapConfigurationInitialized(
  conf: MaybeEmptyMapConfiguration
): conf is MapConfiguration {
  return !!conf.reseauxDeChaleur.limits;
}

export const percentageMaxInterval: Interval = [0, 100];
export const defaultInterval: Interval = [
  Number.MIN_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER,
];

const emptyMapConfiguration: EmptyMapConfiguration = {
  proMode: false,
  filtreIdentifiantReseau: [],
  filtreGestionnaire: [],
  reseauxDeChaleur: {
    show: false,
    energieMajoritaire: undefined,
    energie_ratio_biomasse: percentageMaxInterval,
    energie_ratio_geothermie: percentageMaxInterval,
    energie_ratio_uve: percentageMaxInterval,
    energie_ratio_chaleurIndustrielle: percentageMaxInterval,
    energie_ratio_solaireThermique: percentageMaxInterval,
    energie_ratio_pompeAChaleur: percentageMaxInterval,
    energie_ratio_gaz: percentageMaxInterval,
    energie_ratio_fioul: percentageMaxInterval,
    tauxENRR: percentageMaxInterval,
    emissionsCO2: defaultInterval,
    prixMoyen: defaultInterval,
    anneeConstruction: defaultInterval,
    limits: null, // fetched dynamically from the API
  },
  reseauxDeFroid: false,
  reseauxEnConstruction: false,
  zonesDeDeveloppementPrioritaire: false,
  demandesEligibilite: false,
  consommationsGaz: {
    show: false,
    logements: true,
    tertiaire: true,
    industrie: true,
    interval: [1000, Number.MAX_VALUE],
  },
  batimentsGazCollectif: {
    show: false,
    interval: [50, Number.MAX_VALUE],
  },
  batimentsFioulCollectif: {
    show: false,
    interval: [50, Number.MAX_VALUE],
  },
  batimentsRaccordes: false,
  enrrMobilisables: {
    show: false,
    showDatacenters: true,
    showIndustrie: true,
    showInstallationsElectrogenes: true,
    showStationsDEpuration: true,
    showUnitesDIncineration: true,
    showSolaireThermiqueFriches: true,
    showSolaireThermiqueParkings: true,
  },
  zonesOpportunite: {
    show: false,
    zonesPotentielChaud: true,
    zonesPotentielFortChaud: true,
  },
  caracteristiquesBatiments: false,
};

export const defaultMapConfiguration = createMapConfiguration({
  proMode: true,
  reseauxDeChaleur: {
    show: true,
  },
  reseauxEnConstruction: true,
  consommationsGaz: {
    show: true,
  },
  batimentsGazCollectif: {
    show: true,
  },
  batimentsFioulCollectif: {
    show: true,
  },
});

export const iframeSimpleMapConfiguration = createMapConfiguration({
  reseauxDeChaleur: {
    show: true,
  },
});

export function createMapConfiguration(
  config: DeepPartial<MapConfiguration>
): MapConfiguration {
  return deepMergeObjects(emptyMapConfiguration, config);
}
