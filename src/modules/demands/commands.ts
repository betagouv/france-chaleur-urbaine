import type { Command } from '@commander-js/extra-typings';

import linkExistingDemands from './commands/link-existing-demands';
import migrateFromAirtable from './commands/migrate-from-airtable';

/**
 * Enregistre les commandes CLI liées aux demandes
 */
export function registerDemandsCommands(parentProgram: Command) {
  const program = parentProgram.command('demands').description('Commandes de gestion des demandes');

  program
    .command('migrate-from-airtable')
    .description('Migrate demands from Airtable FCU - Utilisateurs to PostgreSQL')
    .option('--batch-size <number>', 'Number of records to process per batch', '100')
    .option('--dry-run', 'Run without actually inserting data')
    .action(migrateFromAirtable);

  program
    .command('link-existing-demands')
    .description('Link existing demands to users by matching email addresses')
    .option('--dry-run', 'Run without actually linking demands (simulation mode)')
    .action(linkExistingDemands);

  return program;
}
