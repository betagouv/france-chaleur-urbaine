import { z } from 'zod';

import cliConfig from '@/cli-config';
import type { NetworkPermission } from '@/modules/permissions/types';
import { create } from '@/modules/users/server/service';
import { type ApiAccounts, kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({
  dry_run: cliConfig.dryRun,
  module: 'engie',
});

export const validation = z.array(
  z.object({
    contacts: z.array(z.email().toLowerCase().trim()),
    full_url: z.string(),
    id_sncu: z.string(),
    public_name: z.string(),
  })
);

export type EngieApiNetworks = z.infer<typeof validation>;

export const handleData = async (account: ApiAccounts, data: unknown) => {
  const { data: validatedNetworks, success, error } = validation.safeParse(data);
  if (!success) {
    throw new Error('Invalid data', { cause: error });
  }

  // Group emails → set of SNCU IDs they should be granted permission on
  const emailToSncuIds = validatedNetworks
    .flatMap((n) => n.contacts.map((email) => [email, n.id_sncu] as const))
    .reduce((acc, [email, sncu]) => acc.set(email, (acc.get(email) ?? new Set<string>()).add(sncu)), new Map<string, Set<string>>());

  const allSncuIds = [...new Set(validatedNetworks.map((n) => n.id_sncu))];

  // Resolve SNCU → FCU IDs (existing networks only; networks in construction have no SNCU ID)
  // in parallel with fetching active users from this API account.
  const [existingNetworks, existingUsersFromApi] = await Promise.all([
    allSncuIds.length > 0
      ? kdb
          .selectFrom('reseaux_de_chaleur')
          .select(['id_fcu', 'Identifiant reseau'])
          .where('Identifiant reseau', 'in', allSncuIds)
          .execute()
      : Promise.resolve([]),
    kdb
      .selectFrom('users')
      .innerJoin('api_accounts', 'users.from_api', 'api_accounts.key')
      .select(['users.id', 'users.email'])
      .where('api_accounts.name', '=', account.name)
      .where('users.active', '=', true)
      .execute(),
  ]);

  const sncuToFcu = new Map(
    existingNetworks
      .map((n) => [n['Identifiant reseau'], n.id_fcu] as const)
      .filter((entry): entry is [string, number] => entry[0] !== null)
  );

  logger.info(`Found ${existingUsersFromApi.length} users in DB`);

  const feedEmails = new Set(emailToSncuIds.keys());
  const usersToDeactivate = existingUsersFromApi.filter((u) => !feedEmails.has(u.email));

  await Promise.all(
    [...emailToSncuIds].map(async ([email, sncuIds]) => {
      const user = await kdb.selectFrom('users').select(['id']).where('email', '=', email).executeTakeFirst();

      let userId: string;
      if (!user) {
        logger.info(`Create user ${email}`);
        if (cliConfig.dryRun) {
          return;
        }
        const record = await create(
          {
            active: true,
            email,
            from_api: account.key,
            password: '',
            role: 'gestionnaire',
            status: 'valid',
            structure_name: account.name,
          },
          {} as any
        );
        userId = record.id as unknown as string;
      } else {
        logger.info(`Update user ${email} (${user.id})`);
        userId = user.id;
        if (cliConfig.dryRun) {
          return;
        }
        await kdb.updateTable('users').set({ active: true }).where('id', '=', user.id).execute();
      }

      await syncPermissionsForUser(userId, sncuIds, sncuToFcu);
    })
  );

  logger.info(`Deactivate ${usersToDeactivate.length} users not in the API`);

  await Promise.all(
    usersToDeactivate.map(async ({ id, email }) => {
      logger.info(`Deactivate user ${email}`);
      if (!cliConfig.dryRun) {
        await kdb.updateTable('users').set({ active: false }).where('id', '=', id).execute();
      }
    })
  );

  return usersToDeactivate;
};

/**
 * Grants network permissions to a user for the given SNCU IDs. Additive only:
 * existing permissions (manual or API-created) are never removed.
 */
async function syncPermissionsForUser(userId: string, sncuIds: Set<string>, sncuToFcu: Map<string, number>) {
  const permissions: (NetworkPermission & { user_id: string })[] = [...sncuIds]
    .map((sncuId) => sncuToFcu.get(sncuId))
    .filter((idFcu): idFcu is number => idFcu !== undefined)
    .map((idFcu) => ({
      resource_id: String(idFcu),
      type: 'reseau_existant',
      user_id: userId,
    }));

  if (permissions.length > 0) {
    await kdb
      .insertInto('user_permissions')
      .values(permissions)
      .onConflict((oc) => oc.columns(['user_id', 'type', 'resource_id']).doNothing())
      .execute();
  }
}
