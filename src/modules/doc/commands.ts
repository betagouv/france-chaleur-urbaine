import type { Command } from '@commander-js/extra-typings';

import { logger } from '@/server/helpers/logger';

import { writeDocSearchIndex } from './commands/build-search-index';

export function registerDocCommands(parentProgram: Command) {
  const program = parentProgram.command('doc').description('Commandes pour la documentation admin (/admin/doc)');

  program
    .command('build-search-index')
    .description('Génère l’index de recherche plein-texte de la documentation à partir des fichiers MDX')
    .action(() => {
      const count = writeDocSearchIndex();
      logger.info(`✅ Index de recherche de la documentation généré (${count} pages)`);
    });
}
