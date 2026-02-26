import type { Command } from '@commander-js/extra-typings';

import { ObjectKeys } from '@/utils/typescript';

import { dataImportConfigs, executeDataImport, zDataImportType } from './server/import-config';

export function registerDataCommands(parentProgram: Command) {
  const program = parentProgram.command('data').description('Commandes de gestion des données');

  program
    .command('import')
    .description('Import de données basé sur le type')
    .argument('<type>', `Type de données à importer - ${Object.keys(dataImportConfigs).join(', ')}`, (value) =>
      zDataImportType.parse(value)
    )
    .option('--file <FILE>', 'Chemin vers le fichier à importer', '')
    .option('--dry-run', 'Mode simulation, aucune modification Airtable', false)
    .action(async (type, options) => {
      await executeDataImport(type, options.file, {
        dryRun: options.dryRun,
      });
    });

  program
    .command('list')
    .description("Lister les types d'import disponibles")
    .action(() => {
      console.info("Types d'import disponibles:");
      ObjectKeys(dataImportConfigs).forEach((key) => {
        console.info(`  ${key}`);
      });
    });

  return program;
}
