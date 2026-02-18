import { existsSync } from 'node:fs';

import type { Command } from '@commander-js/extra-typings';

import { serverConfig } from '@/server/config';
import { logger } from '@/server/helpers/logger';
import { runCommand } from '@/utils/system';

import { APIDataGouvService } from './server/api-data-gouv';

export function registerOpendataCommands(parentProgram: Command) {
  const program = parentProgram.command('opendata').description('Commandes pour gérer les données OpenData de France Chaleur Urbaine');

  program
    .command('create-archive')
    .description(
      "Cette commande permet de générer l'archive OpenData contenant les données de France Chaleur Urbaine au format Shapefile et GeoJSON. L'archive générée devra être envoyée à Florence en vue d'un dépôt sur la plateforme data.gouv.fr"
    )
    .action(async () => {
      await runCommand('src/modules/opendata/server/create-opendata-archive.sh');
    });

  program
    .command('publish')
    .description('Publie une archive OpenData sur data.gouv.fr dans le dataset des tracés des réseaux de chaleur et de froid')
    .argument('<archive-path>', 'Chemin vers le fichier archive (.zip) à publier')
    .option('--description <desc>', 'Description personnalisée pour la mise à jour')
    .action(async (archivePath, options) => {
      if (!existsSync(archivePath)) {
        logger.error(`Le fichier archive '${archivePath}' n'existe pas.`);
        process.exit(1);
      }

      logger.info(`Publication de l'archive '${archivePath}' sur data.gouv.fr...`);
      logger.info(`Dataset ID: ${serverConfig.DATA_GOUV_FR_DATASET_ID}`);

      const apiDataGouvService = new APIDataGouvService();
      await apiDataGouvService.publishOpendataArchive(
        archivePath,
        `Mise à jour du ${new Date().toLocaleDateString('fr-FR')} : ${options.description ?? 'ajout et actualisation de tracés'}`
      );

      logger.info('✅ Publication réussie !');
      logger.info(`URL du dataset: https://www.data.gouv.fr/datasets/${serverConfig.DATA_GOUV_FR_DATASET_ID}/`);
    });
}
