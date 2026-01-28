import type { Logger } from '@/server/helpers/logger';
import type { RequiredFields } from '@/utils/typescript';

export type ImportOptions = {
  dryRun?: boolean;
  createMissing?: boolean;
};

export type ImportParams = {
  filepath?: string;
  logger: Logger;
  options?: ImportOptions;
};

/**
 * Helper pour typer automatiquement les fonctions d'import
 */
export const defineImportFunc = (func: (params: ImportParams) => Promise<void>) => func;

/**
 * Helper pour typer automatiquement les fonctions d'import de fichier
 */
export const defineFileImportFunc = (func: (params: RequiredFields<ImportParams, 'filepath'>) => Promise<void>) =>
  defineImportFunc(({ filepath, ...params }) => {
    if (!filepath) {
      throw new Error('Vous devez fournir un fichier');
    }
    return func({ ...params, filepath });
  });
