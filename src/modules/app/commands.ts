import { type Command } from '@commander-js/extra-typings';
import { z } from 'zod';

import { logger } from '@/server/helpers/logger';

import { formatImage, formatProfiles } from './commands/image-format';

export function registerAppCommands(parentProgram: Command) {
  const program = parentProgram.command('app').description("Commandes pour l'application");

  program
    .command('image:format')
    .description('Formate une image selon un profil (conversion WebP, redimensionnement, recadrage)')
    .argument('<inputPath>', "Chemin vers l'image source")
    .argument('<profile>', 'Profil de formatage', (v) => z.enum(formatProfiles).parse(v))
    .action(async (inputPath, profile) => {
      logger.info(`📸 Formatage de l'image ${inputPath} avec le profil "${profile}"...`);
      await formatImage(inputPath, profile);
      logger.info(`✅ Image formatée avec succès`);
    });
}
