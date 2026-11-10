import { businessRules } from '@/modules/app/business-rules';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import { kdb, sql } from '@/server/db/kysely';
import { createLogger } from '@/server/helpers/logger';
import { processInParallel } from '@/utils/async';

const logger = createLogger('users:particulier-phase-out');

const formatLongFrenchDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);

/**
 * Active particulier accounts with their announcement state; a blocked Brevo address will not receive the email.
 */
export async function getParticulierPhaseOutStatus() {
  const accounts = await kdb
    .selectFrom('users')
    .leftJoin('email_blocked_contacts', (join) => join.on('email_blocked_contacts.email', '=', sql`lower(users.email)`))
    .select((eb) => [
      'users.id',
      'users.email',
      'email_blocked_contacts.reason_code as email_blocked_reason',
      eb
        .selectFrom('events')
        .select('events.created_at')
        .where('events.type', '=', 'user_particulier_deletion_announced')
        .where('events.context_id', '=', sql<string>`${eb.ref('users.id')}::text`) // context_id is text, users.id is uuid
        .orderBy('events.created_at', 'desc')
        .limit(1)
        .as('announced_at'),
    ])
    .where('users.role', '=', 'particulier')
    .where('users.active', '=', true)
    .orderBy('users.email')
    .execute();

  return {
    accounts,
    announcedCount: accounts.filter((account) => account.announced_at !== null).length,
    toAnnounceCount: accounts.filter((account) => account.announced_at === null).length,
  };
}

/**
 * Sends the deletion announcement to every active particulier account not yet announced, one event per sent email:
 * running it again after a failure resumes where it stopped.
 */
export async function announceParticulierDeletion(deletionDate: string, adminUserId: string) {
  const { accounts } = await getParticulierPhaseOutStatus();
  const recipients = accounts.filter((account) => account.announced_at === null);
  const formattedDate = formatLongFrenchDate(new Date(deletionDate));

  await processInParallel(recipients, businessRules.emailSendConcurrency.value, async (account) => {
    await sendEmailTemplate('auth.utilisateur.suppression-compte-particulier', account, { deletionDate: formattedDate });
    await createUserEvent({
      author_id: adminUserId,
      context_id: account.id,
      context_type: 'user',
      data: { deletion_date: deletionDate },
      type: 'user_particulier_deletion_announced',
    });
  });

  logger.info('particulier deletion announced', { admin_user_id: adminUserId, deletion_date: deletionDate, sent_count: recipients.length });
  return { sentCount: recipients.length };
}

/**
 * Deletes every particulier account (phase 2, on the announced date). Demands are kept: `demands.user_id` becomes NULL
 * through the FK; bulk tests, jobs and comparator configurations cascade.
 */
export async function deleteParticulierAccounts() {
  const accounts = await kdb.selectFrom('users').select(['id', 'email']).where('role', '=', 'particulier').orderBy('email').execute();
  await kdb.deleteFrom('users').where('role', '=', 'particulier').execute();
  await createEvent({
    context_id: null,
    context_type: 'user',
    data: { count: accounts.length },
    type: 'user_particulier_accounts_deleted',
  });
  return accounts;
}
