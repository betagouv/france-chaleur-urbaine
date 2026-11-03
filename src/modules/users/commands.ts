import type { Command } from '@commander-js/extra-typings';
import { z } from 'zod';

import { sendEmailTemplate } from '@/modules/email';
import { createEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { logger } from '@/server/helpers/logger';

const zIsoDate = z.iso.date();

const formatLongFrenchDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);

/** Active particulier accounts not yet announced: rerunning the command after a crash resumes where it stopped. */
const listParticulierAccountsToAnnounce = () =>
  kdb
    .selectFrom('users')
    .select(['id', 'email'])
    .where('role', '=', 'particulier')
    .where('active', '=', true)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom('events')
            .select('id')
            .where('events.context_id', '=', sql<string>`${eb.ref('users.id')}::text`) // context_id is text, users.id is uuid
            .where('events.type', '=', 'user_particulier_deletion_announced')
        )
      )
    )
    .orderBy('email')
    .execute();

/**
 * One-off commands of the particulier accounts phase-out: announcement email, then deletion on the announced date.
 * Demands keep their data (`demands.user_id` is set to NULL by the FK); the other owned rows (bulk tests, jobs…) cascade.
 */
export function registerUsersCommands(parentProgram: Command) {
  const program = parentProgram.command('users').description('Commandes sur les comptes utilisateurs');

  program
    .command('particulier:announce-deletion')
    .description("Envoie l'email d'annonce de suppression à tous les comptes particuliers actifs")
    .argument('<deletionDate>', 'Date de suppression annoncée (AAAA-MM-JJ), au moins 15 jours après l’envoi', (value) =>
      zIsoDate.parse(value)
    )
    .option('--dry-run', "Liste les destinataires sans envoyer d'email", false)
    .action(async (deletionDate, { dryRun }) => {
      const formattedDate = formatLongFrenchDate(new Date(deletionDate));
      const accounts = await listParticulierAccountsToAnnounce();
      logger.info(`${accounts.length} comptes particuliers actifs à prévenir${dryRun ? ' (dry-run, aucun envoi)' : ''}`);
      if (dryRun) {
        accounts.forEach((account) => logger.info(account.email));
        return;
      }
      // sequential on purpose: one event per sent email so a crash can be resumed by rerunning the command
      for (const account of accounts) {
        await sendEmailTemplate('auth.utilisateur.suppression-compte-particulier', account, { deletionDate: formattedDate });
        await createEvent({
          context_id: account.id,
          context_type: 'user',
          data: { deletion_date: deletionDate },
          type: 'user_particulier_deletion_announced',
        });
      }
      logger.info(`Email d'annonce envoyé à ${accounts.length} comptes (suppression le ${formattedDate})`);
    });

  program
    .command('particulier:delete')
    .description('Supprime tous les comptes particuliers (à lancer à la date annoncée) ; les demandes sont conservées')
    .option('--dry-run', 'Liste les comptes sans les supprimer', false)
    .action(async ({ dryRun }) => {
      const accounts = await kdb.selectFrom('users').select(['id', 'email']).where('role', '=', 'particulier').orderBy('email').execute();
      logger.info(`${accounts.length} comptes particuliers${dryRun ? ' (dry-run, aucune suppression)' : ''}`);
      if (dryRun) {
        accounts.forEach((account) => logger.info(account.email));
        return;
      }
      await kdb.deleteFrom('users').where('role', '=', 'particulier').execute();
      await createEvent({
        context_id: null,
        context_type: 'user',
        data: { count: accounts.length },
        type: 'user_particulier_accounts_deleted',
      });
      logger.info(`${accounts.length} comptes particuliers supprimés`);
    });
}
