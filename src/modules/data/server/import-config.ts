import { z } from 'zod';

import type { ImportOptions, ImportParams } from '@/modules/data/server/import';
import { parentLogger } from '@/server/helpers/logger';

import { importConsommationsGaz } from './imports/consommations-gaz';
import { importDonneesReseauxSdes } from './imports/donnees-reseaux-sdes';
import { importEtudesEnCours } from './imports/etudes-en-cours';
import { importQuartiersPrioritairesPolitiqueVille } from './imports/quartiers-prioritaires-politique-ville';
import { importZonesOpportuniteFortFroid } from './imports/zones-opportunite-fort-froid';
import { importZonesOpportuniteFroid } from './imports/zones-opportunite-froid';

type DataImportConfig = (params: ImportParams) => Promise<void>;

// Configuration des imports de données
export const dataImportConfigs = {
  'consommations-gaz': importConsommationsGaz,
  'donnees-reseaux-sdes': importDonneesReseauxSdes,
  'etudes-en-cours': importEtudesEnCours,
  'quartiers-prioritaires-politique-ville': importQuartiersPrioritairesPolitiqueVille,
  'zones-opportunite-fort-froid': importZonesOpportuniteFortFroid,
  'zones-opportunite-froid': importZonesOpportuniteFroid,
} as const satisfies Record<string, DataImportConfig>;

export type DataImportType = keyof typeof dataImportConfigs;

export const zDataImportType = z.enum(Object.keys(dataImportConfigs) as [DataImportType, ...DataImportType[]]);

// Fonction utilitaire pour exécuter un import
export const executeDataImport = async (type: DataImportType, filepath?: string, options?: ImportOptions): Promise<void> => {
  const importFunction = dataImportConfigs[type];
  if (!importFunction) {
    throw new Error(`Type d'import non supporté: ${type}`);
  }

  const logger = parentLogger.child({ name: 'data-import', type });
  await importFunction({ filepath, logger, options });
};
