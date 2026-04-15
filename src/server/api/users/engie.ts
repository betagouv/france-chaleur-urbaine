import { z } from 'zod';

import cliConfig from '@/cli-config';
import { create } from '@/modules/users/server/service';
import { type ApiAccounts, kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { sanitizeEmail } from '@/utils/validation';

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

export type EngieApiNetwork = z.infer<typeof validation>;

export const handleData = async (account: ApiAccounts, networks: EngieApiNetwork) => {
  const { data: validatedNetworks, success, error } = validation.safeParse(networks);
  if (!success) {
    throw new Error('Invalid data', { cause: error });
  }

  // Resolve SNCU IDs to FCU IDs for permissions
  const sncuToFcu = new Map<string, { id_fcu: number; type: 'reseau_existant' | 'reseau_en_construction' }>();
  for (const network of validatedNetworks) {
    const existing = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select('id_fcu')
      .where('"Identifiant reseau"' as any, '=', network.id_sncu)
      .executeTakeFirst();
    if (existing) {
      sncuToFcu.set(network.id_sncu, { id_fcu: existing.id_fcu, type: 'reseau_existant' });
      continue;
    }
    const construction = await kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select('id_fcu')
      .where('"Identifiant reseau"' as any, '=', network.id_sncu)
      .executeTakeFirst();
    if (construction) {
      sncuToFcu.set(network.id_sncu, { id_fcu: construction.id_fcu, type: 'reseau_en_construction' });
    }
  }

  const recordsToSync = validatedNetworks.reduce(
    (acc, network) => {
      network.contacts.forEach((contactEmail) => {
        const entry = acc[contactEmail] || { sncuIds: new Set<string>() };
        entry.sncuIds.add(network.id_sncu);
        acc[contactEmail] = entry;
      });
      return acc;
    },
    {} as Record<string, { sncuIds: Set<string> }>
  );

  const existingUsersFromApi = await kdb
    .selectFrom('users')
    .innerJoin('api_accounts', 'users.from_api', 'api_accounts.key')
    .select(['users.id', 'users.email'])
    .where('api_accounts.name', '=', account.name)
    .where('users.active', '=', true)
    .execute();

  logger.info(`Found ${existingUsersFromApi.length} users in DB`);

  await Promise.all(
    Object.entries(recordsToSync).map(async ([email, { sncuIds }]) => {
      const existingEmailIndex = existingUsersFromApi.findIndex((user) => user.email === email);
      if (existingEmailIndex !== -1) {
        existingUsersFromApi.splice(existingEmailIndex, 1);
      }
      const sanitizedEmail = sanitizeEmail(email);

      const user = await kdb.selectFrom('users').select(['id', 'active']).where('email', '=', sanitizedEmail).executeTakeFirst();

      if (!user) {
        logger.info(`Create user ${email}`);
        if (!cliConfig.dryRun) {
          const record = await create(
            {
              active: true,
              email: sanitizedEmail,
              from_api: account.key,
              password: '',
              role: 'gestionnaire',
              status: 'valid',
              structure_name: account.name,
            },
            {} as any
          );

          // Create permissions for the new user
          const userId = (record as any).id as string;
          await syncPermissionsForUser(userId, sncuIds, sncuToFcu);
        }
        return;
      }

      logger.info(`Update user ${email} (${user.id})`);
      if (!cliConfig.dryRun) {
        await kdb.updateTable('users').set({ active: true }).where('id', '=', user.id).execute();

        // Sync permissions
        await syncPermissionsForUser(user.id, sncuIds, sncuToFcu);
      }
    })
  );

  logger.info(`Deactivate ${existingUsersFromApi.length} users not in the API`);

  await Promise.all(
    existingUsersFromApi.map(async ({ email }) => {
      logger.info(`Deactivate user ${email}`);
      if (!cliConfig.dryRun) {
        await kdb.updateTable('users').set({ active: false }).where('email', '=', email).execute();
      }
    })
  );
  return existingUsersFromApi;
};

/**
 * Syncs user_permissions for a user based on their SNCU network IDs.
 * Adds missing permissions, does not remove manually added ones.
 */
async function syncPermissionsForUser(
  userId: string,
  sncuIds: Set<string>,
  sncuToFcu: Map<string, { id_fcu: number; type: 'reseau_existant' | 'reseau_en_construction' }>
) {
  const permissions: { resource_id: string; type: string; user_id: string }[] = [];

  for (const sncuId of sncuIds) {
    const resolved = sncuToFcu.get(sncuId);
    if (resolved) {
      permissions.push({
        resource_id: String(resolved.id_fcu),
        type: resolved.type,
        user_id: userId,
      });
    }
  }

  if (permissions.length > 0) {
    await kdb
      .insertInto('user_permissions')
      .values(permissions)
      .onConflict((oc) => oc.columns(['user_id', 'type', 'resource_id']).doNothing())
      .execute();
  }
}
