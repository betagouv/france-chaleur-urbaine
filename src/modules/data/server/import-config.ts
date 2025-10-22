import type { ImportParams } from '@/modules/data/server/import';
import { parentLogger } from '@/server/helpers/logger';
import { importConsommationsGaz } from './imports/consommations-gaz';
import { importEtudesEnCours } from './imports/etudes-en-cours';
import { importTestsAdressesLegacy } from './imports/tests-adresses-legacy';
import { importZonesOpportuniteFortFroid } from './imports/zones-opportunite-fort-froid';
import { importZonesOpportuniteFroid } from './imports/zones-opportunite-froid';

type DataImportConfig = (params: ImportParams) => Promise<void>;

// Configuration des imports de données
export const dataImportConfigs = {
  'consommations-gaz': importConsommationsGaz,
  'etudes-en-cours': importEtudesEnCours,
  'tests-adresses-legacy': importTestsAdressesLegacy,
  'zones-opportunite-fort-froid': importZonesOpportuniteFortFroid,
  'zones-opportunite-froid': importZonesOpportuniteFroid,
} as const satisfies Record<string, DataImportConfig>;

export type DataImportType = keyof typeof dataImportConfigs;

// Fonction utilitaire pour exécuter un import
export const executeDataImport = async (type: DataImportType, filepath?: string): Promise<void> => {
  const importFunction = dataImportConfigs[type];
  if (!importFunction) {
    throw new Error(`Type d'import non supporté: ${type}`);
  }

  const logger = parentLogger.child({ name: 'data-import', type });
  await importFunction({ filepath, logger });
};
