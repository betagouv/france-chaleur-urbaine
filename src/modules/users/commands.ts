import type { Command } from '@commander-js/extra-typings';

import { kdb } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

import { deleteParticulierAccounts } from './server/particulier-phase-out';

/**
 * Phase 2 of the particulier accounts phase-out (the announcement is sent from the admin page).
 */
export function registerUsersCommands(parentProgram: Command) {
  const program = parentProgram.command('users').description('Commandes sur les comptes utilisateurs');

  program
    .command('particulier:delete')
    .description('Supprime tous les comptes particuliers (à lancer à la date annoncée) ; les demandes sont conservées')
    .option('--dry-run', 'Liste les comptes sans les supprimer', false)
    .action(async ({ dryRun }) => {
      if (dryRun) {
        const accounts = await kdb.selectFrom('users').select('email').where('role', '=', 'particulier').orderBy('email').execute();
        logger.info(`${accounts.length} comptes particuliers (dry-run, aucune suppression)`);
        accounts.forEach((account) => logger.info(account.email));
        return;
      }
      const accounts = await deleteParticulierAccounts();
      logger.info(`${accounts.length} comptes particuliers supprimés`);
    });
}
