import type { Logger } from '@/server/helpers/logger';
import { parentLogger } from '@/server/helpers/logger';
import { importEtudesEnCours } from './imports/etudes-en-cours';
import { importTestsAdressesLegacy } from './imports/tests-adresses-legacy';
import { importZonesOpportuniteFortFroid } from './imports/zones-opportunite-fort-froid';
import { importZonesOpportuniteFroid } from './imports/zones-opportunite-froid';

type ImportParams = {
  filepath: string;
  logger: Logger;
};

type DataImportConfig = {
  name: string;
  importFunction: (params: ImportParams) => Promise<void>;
  description: string;
};

/**
 * Helper pour typer automatiquement les fonctions d'import
 */
export const defineImportFunc = (func: (params: ImportParams) => Promise<void>) => func;

// Configuration des imports de données
export const dataImportConfigs = {
  'etudes-en-cours': {
    description: 'Import des études en cours depuis un fichier CSV',
    importFunction: importEtudesEnCours,
    name: 'Études en cours',
  },
  'tests-adresses-legacy': {
    description: "Import des tests d'adresses legacy depuis un fichier CSV",
    importFunction: importTestsAdressesLegacy,
    name: 'Tests adresses (legacy)',
  },
  'zones-opportunite-fort-froid': {
    description: "Import des zones d'opportunité fort froid depuis un shapefile",
    importFunction: importZonesOpportuniteFortFroid,
    name: "Zones d'opportunité fort froid",
  },
  'zones-opportunite-froid': {
    description: "Import des zones d'opportunité froid depuis un shapefile",
    importFunction: importZonesOpportuniteFroid,
    name: "Zones d'opportunité froid",
  },
} as const satisfies Record<string, DataImportConfig>;

export type DataImportType = keyof typeof dataImportConfigs;

// Fonction utilitaire pour exécuter un import
export const executeDataImport = async (type: DataImportType, filepath?: string): Promise<void> => {
  const config = dataImportConfigs[type];
  if (!config) {
    throw new Error(`Type d'import non supporté: ${type}`);
  }

  if (!filepath) {
    throw new Error('Vous devez fournir un fichier');
  }

  const logger = parentLogger.child({ name: 'data-import', type });
  await config.importFunction({ filepath, logger });
};
