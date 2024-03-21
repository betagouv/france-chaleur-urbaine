import { deepMergeObjects } from '@utils/core';
import { DeepPartial, FlattenKeys } from '@utils/typescript';

export type MapConfiguration = {
  proMode: boolean;
  reseauxDeChaleur: boolean;
  reseauxDeFroid: boolean;
  reseauxEnConstruction: boolean;
  zonesDeDeveloppementPrioritaire: boolean;
  demandesEligibilite: boolean;
  consommationsGaz: {
    show: boolean;
    logements: boolean;
    tertiaire: boolean;
    industrie: boolean;
    interval: [number, number];
  };
  batimentsGazCollectif: {
    show: boolean;
    interval: [number, number];
  };
  batimentsFioulCollectif: {
    show: boolean;
    interval: [number, number];
  };
  batimentsRaccordes: boolean;
  enrrMobilisables: {
    show: boolean;
    showDatacenters: boolean;
    showIndustrie: boolean;
    showInstallationsElectrogenes: boolean;
    showStationsDEpuration: boolean;
    showUnitesDIncineration: boolean;
  };
  zonesOpportunite: {
    show: boolean;
    zonesPotentielChaud: boolean;
    zonesPotentielFortChaud: boolean;
  };
  caracteristiquesBatiments: boolean;
};
export type MapConfigurationProperty = FlattenKeys<MapConfiguration>;

const emptyMapConfiguration: MapConfiguration = {
  proMode: false,
  reseauxDeChaleur: false,
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
  reseauxDeChaleur: true,
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
  reseauxDeChaleur: true,
});

export function createMapConfiguration(
  config: DeepPartial<MapConfiguration>
): MapConfiguration {
  return deepMergeObjects(emptyMapConfiguration, config);
}
