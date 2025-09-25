import { structureTypes } from '@/modules/users/constants';
import base from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { Airtable } from '@/types/enum/Airtable';
import { USER_ROLE } from '@/types/enum/UserRole';

const DRY_RUN = process.env.DRY_RUN === 'true';

const logger = parentLogger.child({
  dry_run: DRY_RUN,
});

const logDry: typeof logger.info = (message) => logger.info(`${DRY_RUN ? '[DRY_RUN]' : '[LIVE]'} ${message}`);

export const syncComptesProFromUsers = async (interval?: string) => {
  logDry(`Sync pros and particuliers from "users" table`);

  let query = kdb
    .selectFrom('users')
    .where('role', 'in', [USER_ROLE.PROFESSIONNEL, USER_ROLE.PARTICULIER])
    .select([
      'email',
      'role',
      'active',
      'status',
      'accepted_cgu_at',
      'optin_at',
      'created_at',
      'last_connection',
      'first_name',
      'last_name',
      'phone',
      'structure_name',
      'structure_other',
      'structure_type',
    ])
    .where('email', 'like', '%@%'); // Filtre les comptes spéciaux qui ne sont pas des emails et donc pas dans Airtable

  if (interval) {
    query = query.where('created_at', '>', sql.raw<Date>(`NOW() - INTERVAL '${interval}'`));
  }

  const users = await query.execute();

  const stats = { totalCreated: 0, totalUpdated: 0, totalUnchanged: 0 };

  logger.info(`Found ${users.length} users which were created ${interval ? `in the last ${interval}` : 'in the'}`);

  if (users.length === 0) {
    return stats;
  }
  const comptesPro = await base(Airtable.COMPTES_PRO).select().all();

  await Promise.all(
    users.map(async (user, index) => {
      logger.info(`${index + 1}/${users.length} updating compte pro for ${user.email}`);

      const data = {
        Email: user.email,
        Actif: !!user.active,
        'Dernière connexion': user.last_connection?.toISOString(),
        Role: user.role,
        Prénom: user.first_name,
        Nom: user.last_name,
        Téléphone: user.phone
          ? user.phone
              .replace(/\s/g, '')
              .replace(/^\+33/, '0')
              .replace(/(\d{2})(?=\d)/g, '$1 ')
          : null,
        Statut: user.status,
        'Nom de la structure': user.structure_name,
        'Type de structure': user.structure_other || structureTypes[user.structure_type as keyof typeof structureTypes],
        'CGU acceptées': user.accepted_cgu_at?.toISOString(),
        'Créé le': user.created_at?.toISOString(),
        'Optin Newsletter': !!user.optin_at,
      };

      const comptePro = comptesPro.find((comptePro) => comptePro.get('Email') === user.email);
      if (!comptePro) {
        logDry(` ➕ Creating new comptePro for ${user.email}`);
        if (!DRY_RUN) {
          try {
            await base(Airtable.COMPTES_PRO).create([{ fields: data as any }], { typecast: true });
            stats.totalCreated++;
          } catch (e) {
            logger.error(`Could not create ${user.email} in ${Airtable.COMPTES_PRO} with ${JSON.stringify(data)}`, { error: e });
            return;
          }
        } else {
          stats.totalCreated++;
        }
        return;
      }

      if (comptePro.get('Dernière connexion') === user.last_connection?.toISOString() && comptePro.get('Actif') === !!user.active) {
        logDry(` 💤 comptePro ${user.email} has not changed`);
        stats.totalUnchanged++;
        return;
      }

      logDry(` 🔄 Update ${user.email} with`, JSON.stringify(data));
      if (!DRY_RUN) {
        try {
          await base(Airtable.COMPTES_PRO).update(comptePro.id, data as any, { typecast: true });
        } catch (e) {
          logger.error(`Could not update ${user.email} to ${Airtable.COMPTES_PRO} with ${JSON.stringify(data)}`, { error: e });
          return;
        }
      }
      stats.totalUpdated++;
    })
  );
  logger.info(`======== Sync last connection from userds`);
  logger.info(`Total created: ${stats.totalCreated} Total updated: ${stats.totalUpdated}, unchanged: ${stats.totalUnchanged}`);
  logger.info(`========`);
  return stats;
};
