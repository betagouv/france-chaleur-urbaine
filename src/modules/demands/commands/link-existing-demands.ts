import { linkDemandsByEmail } from '@/modules/demands/server/demands-service';
import { kdb } from '@/server/db/kysely';
import { sql } from '@/server/db/kysely/index';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({
  module: 'link-existing-demands',
});

/**
 * CLI command to link existing demands to users by email.
 * Run once after deploying the user_id column migration.
 *
 * This command:
 * 1. Fetches all active users from the database
 * 2. For each user, links all unlinked demands with matching email
 * 3. Logs progress and results
 *
 * Usage:
 *   pnpm cli demands link-existing-demands
 *   pnpm cli demands link-existing-demands --dry-run
 */
export default async (options: { dryRun?: boolean }) => {
  const dryRun = options.dryRun || false;

  logger.info('Starting to link existing demands to users...', { dryRun });

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
  }

  const users = await kdb.selectFrom('users').select(['id', 'email']).where('active', 'is', true).execute();

  logger.info(`Found ${users.length} active users to process`);

  let totalLinked = 0;
  let usersWithLinkedDemands = 0;

  for (const user of users) {
    try {
      if (dryRun) {
        // In dry-run mode, just count the demands that would be linked
        const demandsToLink = await kdb
          .selectFrom('demands')
          .select('id')
          .where('user_id', 'is', null)
          .where(sql`LOWER(legacy_values->>'Mail')`, '=', user.email.toLowerCase())
          .where('deleted_at', 'is', null)
          .execute();

        const count = demandsToLink.length;

        if (count > 0) {
          usersWithLinkedDemands++;
          totalLinked += count;
          logger.info(`Would link ${count} demand(s) for user ${user.email} (${user.id})`);
        }
      } else {
        const linked = await linkDemandsByEmail(user.id, user.email);

        if (linked > 0) {
          usersWithLinkedDemands++;
          totalLinked += linked;
          logger.info(`Linked ${linked} demand(s) for user ${user.email} (${user.id})`);
        }
      }
    } catch (error) {
      logger.error(`Failed to link demands for user ${user.email} (${user.id})`, { error });
    }
  }

  const action = dryRun ? 'Would be linked' : 'Linked';
  logger.info(`Migration ${dryRun ? 'simulation' : ''} completed`, {
    totalLinked,
    totalUsers: users.length,
    usersWithLinkedDemands,
  });

  console.log('\n=== Migration Summary ===');
  console.log(`Total users processed: ${users.length}`);
  console.log(`Users with ${dryRun ? 'linkable' : 'linked'} demands: ${usersWithLinkedDemands}`);
  console.log(`Total demands ${dryRun ? 'that would be linked' : 'linked'}: ${totalLinked}`);
  console.log('========================\n');
};
