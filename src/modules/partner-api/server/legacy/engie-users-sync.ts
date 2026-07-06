import { z } from 'zod';

import cliConfig from '@/cli-config';
import { createEvent } from '@/modules/events/server/service';
import type { NetworkPermission } from '@/modules/permissions/types';
import { create } from '@/modules/users/server/service';
import { kdb } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({ dry_run: cliConfig.dryRun, module: 'engie' });

const validation = z.array(
  z.object({
    contacts: z.array(z.email().toLowerCase().trim()),
    full_url: z.string(),
    id_sncu: z.string(),
    public_name: z.string(),
  })
);

/**
 * Synchro déclarative des comptes gestionnaires ENGIE : crée/réactive les utilisateurs présents dans le flux
 * (permissions réseau additives par SNCU), désactive ceux qui en sont absents. Format du flux : voir `validation`.
 *
 * Appelée par ENGIE chaque vendredi ~12h. Contacts ENGIE :
 *  - Julien — développeur (julien@clic-droit.fr)
 *  - Clément Neyrand — Responsable Digital Opérationnel chez ENGIE (clement.neyrand@engie.com)
 *
 * Partagée par la route `PUT /api/v1/users/{key}` et la commande CLI `debug:upsert-users-from-api`.
 */
export const syncEngieUsers = async (org: { id: string; name: string }, data: unknown) => {
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
    kdb.selectFrom('users').select(['id', 'email']).where('from_organization_id', '=', org.id).where('active', '=', true).execute(),
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
      const user = await kdb.selectFrom('users').select(['id', 'active']).where('email', '=', email).executeTakeFirst();

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
            from_organization_id: org.id,
            optin_at: null,
            receive_new_demands: true,
            receive_old_demands: true,
            role: 'gestionnaire',
            structure_name: org.name,
          },
          {} as any
        );
        userId = record.id as unknown as string;
        await createEvent({
          context_id: userId,
          context_type: 'user',
          data: { api_name: org.name, role: 'gestionnaire', user_email: email },
          type: 'user_created_by_api',
        });
      } else {
        logger.info(`Update user ${email} (${user.id})`);
        userId = user.id;
        if (cliConfig.dryRun) {
          return;
        }
        await kdb.updateTable('users').set({ active: true }).where('id', '=', user.id).execute();
      }

      await syncPermissionsForUser(userId, email, sncuIds, sncuToFcu, org.name);
    })
  );

  logger.info(`Deactivate ${usersToDeactivate.length} users not in the API`);

  await Promise.all(
    usersToDeactivate.map(async ({ id, email }) => {
      logger.info(`Deactivate user ${email}`);
      if (!cliConfig.dryRun) {
        await kdb.updateTable('users').set({ active: false }).where('id', '=', id).execute();
        await createEvent({
          context_id: id,
          context_type: 'user',
          data: { api_name: org.name, user_email: email },
          type: 'user_deactivated_by_api',
        });
      }
    })
  );

  return usersToDeactivate;
};

/**
 * Grants network permissions to a user for the given SNCU IDs. Additive only:
 * existing permissions (manual or API-created) are never removed.
 * Emits a `user_permissions_synced_from_api` event when new permissions are actually inserted.
 */
async function syncPermissionsForUser(
  userId: string,
  userEmail: string,
  sncuIds: Set<string>,
  sncuToFcu: Map<string, number>,
  apiName: string
) {
  const permissions: (NetworkPermission & { user_id: string })[] = [...sncuIds]
    .map((sncuId) => sncuToFcu.get(sncuId))
    .filter((idFcu): idFcu is number => idFcu !== undefined)
    .map((idFcu) => ({
      resource_id: String(idFcu),
      type: 'reseau_de_chaleur',
      user_id: userId,
    }));

  if (permissions.length === 0) return;

  const inserted = await kdb
    .insertInto('user_permissions')
    .values(permissions)
    .onConflict((oc) => oc.columns(['user_id', 'type', 'resource_id']).doNothing())
    .returning(['type', 'resource_id'])
    .execute();

  if (inserted.length > 0) {
    await createEvent({
      context_id: userId,
      context_type: 'user',
      data: { added: inserted, api_name: apiName, user_email: userEmail },
      type: 'user_permissions_synced_from_api',
    });
  }
}
