import type { Command } from '@commander-js/extra-typings';

import { processJobById, processJobsIndefinitely } from './server/processor';

/**
 * Enregistre les commandes CLI pour la gestion des jobs
 */
export function registerJobsCommands(parentProgram: Command) {
  const program = parentProgram.command('jobs').description('Commandes pour la gestion des jobs');

  program
    .command('start')
    .description('Start the jobs worker')
    .action(async () => {
      await processJobsIndefinitely();
    });

  program
    .command('process')
    .description('Process a specific job by ID')
    .argument('<jobId>', 'Job ID to process')
    .action(async (jobId) => {
      await processJobById(jobId);
    });
}
