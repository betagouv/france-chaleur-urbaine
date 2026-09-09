import { readFile, writeFile } from 'node:fs/promises';

import type { Command } from '@commander-js/extra-typings';

import { ObjectKeys } from '@/utils/typescript';

import { dataImportConfigs, executeDataImport, zDataImportType } from './server/import-config';
import { parseArreteDpeHtml, toArreteDpeCsv } from './server/imports/arrete-dpe';

export function registerDataCommands(parentProgram: Command) {
  const program = parentProgram.command('data').description('Commandes de gestion des données');

  program
    .command('import')
    .description('Import de données basé sur le type')
    .argument('<type>', `Type de données à importer - ${Object.keys(dataImportConfigs).join(', ')}`, (value) =>
      zDataImportType.parse(value)
    )
    .option('--file <FILE>', 'Chemin vers le fichier à importer', '')
    .option('--dry-run', 'Mode simulation, aucune modification', false)
    .action(async (type, options) => {
      await executeDataImport(type, options.file, {
        dryRun: options.dryRun,
      });
    });

  program
    .command('arrete-dpe:html-to-csv')
    .description(
      "Extrait le tableau des réseaux de l'annexe de l'arrêté DPE (page Légifrance enregistrée en HTML) vers un CSV à versionner"
    )
    .argument('<htmlFile>', "Page Légifrance de l'arrêté enregistrée en HTML")
    .argument('<csvFile>', 'Fichier CSV de sortie (ex: src/data/arrete-dpe/2026.csv)')
    .action(async (htmlFile, csvFile) => {
      const rows = parseArreteDpeHtml(await readFile(htmlFile, 'utf8'));
      await writeFile(csvFile, toArreteDpeCsv(rows), 'utf8');
      console.info(`${rows.length} réseaux extraits vers ${csvFile}`);
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
