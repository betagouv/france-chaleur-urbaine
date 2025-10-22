import type { Command } from '@commander-js/extra-typings';

/**
 * Enregistre les commandes CLI liées aux données BDNB
 */
export function registerBdnbCommands(parentProgram: Command) {
  const program = parentProgram.command('bdnb').description('Commandes liées à la BDNB');

  program
    .command('export')
    .description('')
    .action(async () => {
      console.info('Veuillez regarder les étapes dans src/modules/bdnb/scripts/readme.md');
    });

  program
    .command('export-qpv')
    .description('')
    .action(async () => {
      console.info('Veuillez regarder les étapes dans src/modules/bdnb/scripts/qpv/readme.md');
    });
}
