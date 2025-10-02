import type { Command } from '@commander-js/extra-typings';
import path from 'path';

import { runCommand } from '@/utils/system';

/**
 * Enregistre les commandes CLI pour l'optimisation des assets
 */
export function registerOptimizationCommands(parentProgram: Command) {
  const program = parentProgram.command('optimize').description('Commandes pour optimiser les assets du projet');

  program
    .command('images')
    .description('Optimise toutes les images du répertoire public/')
    .action(async () => {
      const scriptPath = path.join(__dirname, 'commands', 'image-optimize.sh');
      await runCommand(scriptPath);
    });
}
