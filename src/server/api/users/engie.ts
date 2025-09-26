import { z } from 'zod';

import cliConfig from '@/cli-config';
import { create } from '@/modules/users/server/service';
import { type ApiAccounts, kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { sanitizeEmail } from '@/utils/validation';

const logger = parentLogger.child({
  module: 'engie',
  dry_run: cliConfig.dryRun,
});

export const validation = z.array(
  z.object({
    id_sncu: z.string(),
    full_url: z.string(),
    public_name: z.string(),
    contacts: z.array(z.email().toLowerCase().trim()),
  })
);

export type EngieApiNetwork = z.infer<typeof validation>;

export const handleData = async (account: ApiAccounts, networks: EngieApiNetwork) => {
  const { data: validatedNetworks, success, error } = validation.safeParse(networks);
  if (!success) {
    throw new Error('Invalid data', { cause: error });
  }

  const recordsToSync = validatedNetworks.reduce(
    (acc, network) => {
      network.contacts.forEach((contactEmail) => {
        const networkTag = `ENGIE_${network.id_sncu}`;

        const tagsByEmail = acc[contactEmail] || new Set([]);

        tagsByEmail.add(networkTag);
        acc[contactEmail] = tagsByEmail;
      });
      return acc;
    },
    {} as Record<string, Set<string>>
  );

  const existingUsersFromApi = await kdb
    .selectFrom('users')
    .innerJoin('api_accounts', 'users.from_api', 'api_accounts.key')
    .select(['users.email', 'users.gestionnaires'])
    .where('api_accounts.name', '=', account.name)
    .where('users.active', '=', true)
    .execute();

  logger.info(`🔍 Found ${existingUsersFromApi.length} users in DB`);

  await Promise.all(
    Object.entries(recordsToSync).map(async ([email, tags]) => {
      const existingEmailIndex = existingUsersFromApi.findIndex((user) => user.email === email);
      if (existingEmailIndex !== -1) {
        existingUsersFromApi.splice(existingEmailIndex, 1);
      }
      const apiTags = Array.from(tags);
      const sanitizedEmail = sanitizeEmail(email);

      const user = await kdb
        .selectFrom('users')
        .select(['id', 'gestionnaires_from_api', 'gestionnaires', 'active'])
        .where('email', '=', sanitizedEmail)
        .executeTakeFirst();

      if (!user) {
        logger.info(`🆕 Create user ${email}`);
        if (!cliConfig.dryRun) {
          await create(
            {
              status: 'valid',
              role: 'gestionnaire',
              password: '',
              active: true,
              structure_name: account.name,
              email: sanitizedEmail,
              gestionnaires: apiTags,
              gestionnaires_from_api: apiTags,
              from_api: account.key,
            },
            {} as any
          );
        } else {
          logger.info(' ⏭️ Skipped');
        }
        return;
      }

      const allTags = [...new Set([...(user.gestionnaires || []), ...apiTags])];

      if (JSON.stringify(user.gestionnaires) === JSON.stringify(allTags) && user.active === true) {
        logger.info(`💤 User ${email} already has the same tags and is active`);
        return;
      }

      logger.info(`🔄 Update user ${email} (${user.id})`, { gestionnaires_from_api: user.gestionnaires_from_api });
      if (!cliConfig.dryRun) {
        logger.info(' ✅ Done');
        await kdb
          .updateTable('users')
          .set({
            gestionnaires: allTags,
            gestionnaires_from_api: apiTags,
            active: true,
          })
          .where('id', '=', user.id)
          .execute();
      } else {
        logger.info(' ⏭️ Skipped');
      }
    })
  );

  logger.info(`🔍 Deactivate ${existingUsersFromApi.length} users not in the API`);

  await Promise.all(
    existingUsersFromApi.map(async ({ email }) => {
      logger.info(`🚫 Deactivate user ${email}`);
      if (!cliConfig.dryRun) {
        await kdb.updateTable('users').set({ active: false }).where('email', '=', email).execute();
      } else {
        logger.info(' ⏭️ Skipped');
      }
    })
  );
  return existingUsersFromApi;
};
