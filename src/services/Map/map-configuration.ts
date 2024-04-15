import { deepMergeObjects } from '@utils/core';
import { DeepPartial, FlattenKeys } from '@utils/typescript';

type Interval = [number, number];

export const energiesMajoritaires = [
  'Biomasse',
  'Géothermie',
  'UVE',
  'Chaleur industrielle',
  'Solaire thermique',
  'Pompe à chaleur',
  'Gaz',
  'Fioul',
] as const;

type EnergieMajoritaire = (typeof energiesMajoritaires)[number];

export type MapConfiguration = {
  proMode: boolean;
  reseauxDeChaleur: {
    show: boolean;
    energieMajoritaire?: EnergieMajoritaire;
    energiesSecondaires: Record<EnergieMajoritaire, Interval>;
    tauxENRR: Interval;
    emissionCO2: Interval;
    prixMoyen: Interval;
    periodeConstruction: Interval;
  };
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
export type MapConfigurationProperty = FlattenKeys<MapConfiguration>;

export const percentageMaxInterval: Interval = [0, 100];
export const emissionCO2MaxInterval: Interval = [0, 500];
export const prixMoyenMaxInterval: Interval = [0, 300];
export const periodeConstructionMaxInterval: Interval = [1900, 2024];

const emptyMapConfiguration: MapConfiguration = {
  proMode: false,
  reseauxDeChaleur: {
    show: false,
    energieMajoritaire: undefined,
    energiesSecondaires: {
      Biomasse: percentageMaxInterval,
      Géothermie: percentageMaxInterval,
      UVE: percentageMaxInterval,
      'Chaleur industrielle': percentageMaxInterval,
      'Solaire thermique': percentageMaxInterval,
      'Pompe à chaleur': percentageMaxInterval,
      Gaz: percentageMaxInterval,
      Fioul: percentageMaxInterval,
    },
    tauxENRR: percentageMaxInterval,
    emissionCO2: [0, 500],
    prixMoyen: prixMoyenMaxInterval,
    periodeConstruction: [1900, 2024],
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
    tauxENRR: [0, 100],
  },
  reseauxEnConstruction: true,
  consommationsGaz: {
    show: true,
    logements: true,
    tertiaire: true,
    industrie: true,
    interval: [1000, Number.MAX_VALUE],
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
