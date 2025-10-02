import { communesFortPotentielPourCreationReseauxChaleurInterval } from '@/components/Map/layers/communesFortPotentielPourCreationReseauxChaleur';
import { deepMergeObjects } from '@/utils/core';
import type { Interval } from '@/utils/interval';
import type { DeepPartial, FlattenKeys } from '@/utils/typescript';

type FiltreEnergie = {
  label: string;
  confKey: string;
};

export const filtresEnergies = [
  {
    confKey: 'biomasse',
    label: 'Biomasse',
  },
  {
    confKey: 'geothermie',
    label: 'Géothermie',
  },
  {
    confKey: 'uve',
    label: 'UVE',
  },
  {
    confKey: 'chaleurIndustrielle',
    label: 'Chaleur industrielle',
  },
  {
    confKey: 'solaireThermique',
    label: 'Solaire thermique',
  },
  {
    confKey: 'pompeAChaleur',
    label: 'Pompe à chaleur',
  },
  {
    confKey: 'gaz',
    label: 'Gaz',
  },
  {
    confKey: 'fioul',
    label: 'Fioul',
  },
] as const satisfies readonly FiltreEnergie[];

export type FiltreEnergieConfKey = (typeof filtresEnergies)[number]['confKey'];

type EnergieRatioConfKey = `energie_ratio_${FiltreEnergieConfKey}`;

export type MapConfiguration = {
  filtreIdentifiantReseau: string[];
  filtreGestionnaire: string[];
  reseauxDeChaleur: {
    show: boolean;
    isClassed: boolean;
    energieMobilisee: FiltreEnergieConfKey[];
    tauxENRR: Interval;
    emissionsCO2: Interval;
    contenuCO2: Interval;
    prixMoyen: Interval;
    livraisonsAnnuelles: Interval;
    anneeConstruction: Interval;
    gestionnaires: string[];
    limits: {
      tauxENRR: Interval;
      emissionsCO2: Interval;
      contenuCO2: Interval;
      prixMoyen: Interval;
      livraisonsAnnuelles: Interval;
      anneeConstruction: Interval;
    };
  } & Record<EnergieRatioConfKey, Interval>;
  reseauxDeFroid: boolean;
  reseauxEnConstruction: boolean;
  zonesDeDeveloppementPrioritaire: boolean;
  demandesEligibilite: boolean;
  testsAdresses: boolean;
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
  batimentsRaccordesReseauxChaleur: boolean;
  batimentsRaccordesReseauxFroid: boolean;
  enrrMobilisablesChaleurFatale: {
    show: boolean;
    showUnitesDIncineration: boolean;
    showIndustrie: boolean;
    showStationsDEpuration: boolean;
    showDatacenters: boolean;
    showInstallationsElectrogenes: boolean;
  };
  enrrMobilisablesGeothermieProfonde: boolean;
  enrrMobilisablesSolaireThermique: {
    show: boolean;
    showFriches: boolean;
    showParkings: boolean;
  };
  enrrMobilisablesThalassothermie: boolean;
  geothermieProfonde: {
    show: boolean;
    showInstallations: boolean;
    showPerimetres: boolean;
  };
  geothermieSurfaceEchangeursOuverts: {
    show: boolean;
    showInstallationsRealisees: boolean;
    showInstallationsDeclarees: boolean;
    showOuvragesRealises: boolean;
    showOuvragesDeclares: boolean;
  };
  geothermieSurfaceEchangeursFermes: {
    show: boolean;
    showInstallationsRealisees: boolean;
    showInstallationsDeclarees: boolean;
    showOuvragesRealises: boolean;
    showOuvragesDeclares: boolean;
  };
  zonesOpportunite: {
    show: boolean;
    zonesPotentielChaud: boolean;
    zonesPotentielFortChaud: boolean;
  };
  zonesOpportuniteFroid: {
    show: boolean;
    zonesPotentielFroid: boolean;
    zonesPotentielFortFroid: boolean;
  };
  caracteristiquesBatiments: boolean;
  besoinsEnChaleur: boolean;
  besoinsEnFroid: boolean;
  besoinsEnChaleurIndustrieCommunes: boolean;
  etudesEnCours: boolean;
  communesFortPotentielPourCreationReseauxChaleur: {
    show: boolean;
    population: Interval;
  };
  quartiersPrioritairesPolitiqueVille: {
    show: boolean;
    qpv2015anru: boolean;
    qpv2024: boolean;
  };
  zonesAUrbaniser: boolean;
  ressourcesGeothermalesNappes: boolean;
  densiteThermiqueLineaire: boolean;
  mesureDistance: boolean;
  extractionDonneesBatiment: boolean;
  customGeojson: boolean;
  geomUpdate: boolean;
};

/**
 * Map configuration qui doit être complétée dynamiquement avec les limites
 * des réseaux de chaleur, afin de construire les limites pour les filtres.
 */
export type EmptyMapConfiguration = Omit<MapConfiguration, 'reseauxDeChaleur'> & {
  reseauxDeChaleur: Omit<MapConfiguration['reseauxDeChaleur'], 'limits'> & {
    limits: null;
  };
};

export type MaybeEmptyMapConfiguration = MapConfiguration | EmptyMapConfiguration;

export type MapConfigurationProperty<ValueType = any> = FlattenKeys<MapConfiguration, ValueType>;

export function isMapConfigurationInitialized(conf: MaybeEmptyMapConfiguration): conf is MapConfiguration {
  return !!conf.reseauxDeChaleur.limits;
}

export const percentageMaxInterval: Interval = [0, 100];
export const defaultInterval: Interval = [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];

export const emptyMapConfiguration: EmptyMapConfiguration = {
  batimentsFioulCollectif: {
    interval: [50, Number.MAX_VALUE],
    show: false,
  },
  batimentsGazCollectif: {
    interval: [50, Number.MAX_VALUE],
    show: false,
  },
  batimentsRaccordesReseauxChaleur: false,
  batimentsRaccordesReseauxFroid: false,
  besoinsEnChaleur: false,
  besoinsEnChaleurIndustrieCommunes: false,
  besoinsEnFroid: false,
  caracteristiquesBatiments: false,
  communesFortPotentielPourCreationReseauxChaleur: {
    population: communesFortPotentielPourCreationReseauxChaleurInterval,
    show: false,
  },
  consommationsGaz: {
    industrie: true,
    interval: [1000, Number.MAX_VALUE],
    logements: true,
    show: false,
    tertiaire: true,
  },
  customGeojson: false,
  demandesEligibilite: false,
  densiteThermiqueLineaire: false,
  enrrMobilisablesChaleurFatale: {
    show: false,
    showDatacenters: true,
    showIndustrie: true,
    showInstallationsElectrogenes: true,
    showStationsDEpuration: true,
    showUnitesDIncineration: true,
  },
  enrrMobilisablesGeothermieProfonde: false,
  enrrMobilisablesSolaireThermique: {
    show: false,
    showFriches: true,
    showParkings: true,
  },
  enrrMobilisablesThalassothermie: false,
  etudesEnCours: false,
  extractionDonneesBatiment: false,
  filtreGestionnaire: [],
  filtreIdentifiantReseau: [],
  geomUpdate: false,
  geothermieProfonde: {
    show: false,
    showInstallations: true,
    showPerimetres: true,
  },
  geothermieSurfaceEchangeursFermes: {
    show: false,
    showInstallationsDeclarees: true,
    showInstallationsRealisees: true,
    showOuvragesDeclares: false,
    showOuvragesRealises: false,
  },
  geothermieSurfaceEchangeursOuverts: {
    show: false,
    showInstallationsDeclarees: true,
    showInstallationsRealisees: true,
    showOuvragesDeclares: false,
    showOuvragesRealises: false,
  },
  mesureDistance: false,
  quartiersPrioritairesPolitiqueVille: {
    qpv2015anru: true,
    qpv2024: true,
    show: false,
  },
  reseauxDeChaleur: {
    anneeConstruction: defaultInterval,
    contenuCO2: defaultInterval,
    emissionsCO2: defaultInterval,
    energie_ratio_biomasse: percentageMaxInterval,
    energie_ratio_chaleurIndustrielle: percentageMaxInterval,
    energie_ratio_fioul: percentageMaxInterval,
    energie_ratio_gaz: percentageMaxInterval,
    energie_ratio_geothermie: percentageMaxInterval,
    energie_ratio_pompeAChaleur: percentageMaxInterval,
    energie_ratio_solaireThermique: percentageMaxInterval,
    energie_ratio_uve: percentageMaxInterval,
    energieMobilisee: [],
    gestionnaires: [],
    isClassed: false,
    limits: null, // fetched dynamically from the API
    livraisonsAnnuelles: defaultInterval,
    prixMoyen: defaultInterval,
    show: false,
    tauxENRR: percentageMaxInterval,
  },
  reseauxDeFroid: false,
  reseauxEnConstruction: false,
  ressourcesGeothermalesNappes: false,
  testsAdresses: false,
  zonesAUrbaniser: false,
  zonesDeDeveloppementPrioritaire: false,
  zonesOpportunite: {
    show: false,
    zonesPotentielChaud: true,
    zonesPotentielFortChaud: true,
  },
  zonesOpportuniteFroid: {
    show: false,
    zonesPotentielFortFroid: true,
    zonesPotentielFroid: true,
  },
};

export const defaultMapConfiguration = createMapConfiguration({
  customGeojson: true,
  reseauxDeChaleur: {
    show: true,
  },
  reseauxEnConstruction: true,
});

export const iframeSimpleMapConfiguration = createMapConfiguration({
  reseauxDeChaleur: {
    show: true,
  },
});

export function createMapConfiguration(config: DeepPartial<MapConfiguration>): MapConfiguration {
  return deepMergeObjects(emptyMapConfiguration, config);
}
