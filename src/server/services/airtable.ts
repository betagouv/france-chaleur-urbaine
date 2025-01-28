import bcrypt from 'bcryptjs';

import db from '@/server/db';
import base from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { parentLogger } from '@/server/helpers/logger';
import { type ApiAccount } from '@/types/ApiAccount';
import { Airtable } from '@/types/enum/Airtable';
import { USER_ROLE } from '@/types/enum/UserRole';
import { diff } from '@/utils/array';
import { sanitizeEmail } from '@/utils/validation';

import { sendInscriptionEmail } from '../email';

const DRY_RUN = process.env.DRY_RUN === 'true';

const logger = parentLogger.child({
  dry_run: DRY_RUN,
});

const logDry: typeof logger.info = (message) => logger.info(`${DRY_RUN ? '[DRY_RUN]' : '[LIVE]'} ${message}`);

export interface ApiNetwork {
  id_sncu: string;
  full_url?: string;
  public_name?: string;
  contacts: string[];
}

export const syncLastConnectionFromUsers = async (interval?: string) => {
  logDry(`Sync last connection from "users" table`);

  let query = kdb
    .selectFrom('users')
    .select(['id', 'email', 'active', 'last_connection'])
    .where('last_connection', 'is not', null)
    .where('active', '=', true)
    .where('email', 'like', '%@%'); // Filtre les comptés spéciaux qui ne sont pas des emails et donc pas dans Airtable

  if (interval) {
    query = query.where('last_connection', '>', sql.raw<Date>(`NOW() - INTERVAL '${interval}'`));
  }

  const users = await query.execute();

  const stats = { totalUpdated: 0, totalUnchanged: 0 };

  logger.info(`Found ${users.length} users which last connected ${interval ? `in the last ${interval}` : 'at least once'}`);

  if (users.length === 0) {
    return stats;
  }
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();

  await Promise.all(
    users.map(async ({ email, last_connection }, index) => {
      logger.info(`${index + 1}/${users.length} updating last connection for ${email}`);

      const gestionnaire = gestionnaires.find((gestionnaire) => gestionnaire.get('Email') === email);
      if (!gestionnaire) {
        logDry(` 💤 No gestionnaire found for ${email}`);
        return;
      }

      if (gestionnaire.get('Dernière connexion') === last_connection?.toISOString()) {
        logDry(` 💤 gestionnaire ${email} has same last connexion`);
        stats.totalUnchanged++;
        return;
      }

      stats.totalUpdated++;

      const data = {
        'Dernière connexion': last_connection?.toISOString(),
      };
      logDry(` 🔄 Update ${email} with`, JSON.stringify(data));
      if (!DRY_RUN) {
        try {
          await base(Airtable.GESTIONNAIRES).update(gestionnaire.id, data, { typecast: true });
        } catch (e) {
          stats.totalUpdated = Math.max(stats.totalUpdated - 1, 0);
          logger.error(`Could not update ${email} to ${Airtable.GESTIONNAIRES} with ${JSON.stringify(data)}`, { error: e });
        }
      }
    })
  );
  logger.info(`======== Sync last connection from userds`);
  logger.info(`Total updated: ${stats.totalUpdated}, unchanged: ${stats.totalUnchanged}`);
  logger.info(`========`);
  return stats;
};

export const syncGestionnairesWithUsers = async () => {
  await sanitizeGestionnairesEmails();
  logDry(`Sync users from "${Airtable.GESTIONNAIRES}" sheet`);
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  const users = await db('users')
    .select('id', 'email', 'active', 'gestionnaires', 'receive_new_demands', 'receive_old_demands')
    // QUESTION should we update only gestionnaires ?
    .where('role', USER_ROLE.GESTIONNAIRE);

  const salt = await bcrypt.genSalt(10);

  const stats = {
    totalCreated: 0,
    totalDeactivated: 0,
    totalUpdated: 0,
  };

  await Promise.all(
    gestionnaires.map(async (gestionnaire, gestionnaireIndex) => {
      const email = gestionnaire.get('Email') as string;
      logger.info(`-> ${gestionnaireIndex + 1}/${gestionnaires.length} Processing ${email}`);
      const tags = (gestionnaire.get('Réseaux') || []) as string[];
      const tagsFromAPI = (gestionnaire.get('Réseaux API') || []) as string[];
      const newDemands = !!gestionnaire.get('Nouvelle demande');
      const oldDemands = !!gestionnaire.get('Relance');
      const active = !!gestionnaire.get('Actif');
      const allTags = [...new Set([...tags, ...tagsFromAPI])];
      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        logDry(`    🆕 Create user for ${email} with ${allTags.join(',')}.`);
        const data = {
          email: email.toLowerCase(),
          password: await bcrypt.hash(Math.random().toString(36).slice(2, 10), salt),
          gestionnaires: allTags,
          receive_new_demands: newDemands,
          receive_old_demands: oldDemands,
          active,
          role: USER_ROLE.GESTIONNAIRE,
        };

        if (!DRY_RUN && process.env.NODE_ENV !== 'production') {
          logger.error(
            `User ${email} not created in database as it will send email to users, you need to set NODE_ENV=production to create users`
          );
          return;
        }

        if (!DRY_RUN && process.env.NODE_ENV === 'production') {
          try {
            await db('users').insert(data);
            await base(Airtable.GESTIONNAIRES).update(
              gestionnaire.id,
              {
                'Créé en base': new Date().toISOString(),
              },
              { typecast: true }
            );
          } catch (e) {
            logger.error(`Could not create ${email} in database`, { error: e });
          }
        }

        logDry(`    📩 Sending inscription email to ${email}`);
        if (!DRY_RUN && process.env.NODE_ENV === 'production') await sendInscriptionEmail(email);
        stats.totalCreated++;
        return;
      }

      if (!active && user.active) {
        logDry(`    ❌ Deactivate user ${email}`);
        if (!DRY_RUN) {
          try {
            await db('users').update('active', false).where('id', user.id);
          } catch (e) {
            logger.error(`Could not create ${email} in database`, { error: e });
          }
        }
        stats.totalDeactivated++;
        return;
      }
      const { unchanged } = diff(user.gestionnaires || [], allTags);

      if (
        unchanged.length === allTags.length &&
        user.receive_new_demands === newDemands &&
        user.receive_old_demands === oldDemands &&
        user.active === active
      ) {
        logDry(`    💤 No changes for ${email}`);
        return;
      }

      logDry(`    ✅ Update gestionnaires for ${email}`);
      if (!DRY_RUN) {
        try {
          await db('users')
            .update({
              gestionnaires: allTags,
              receive_new_demands: newDemands,
              receive_old_demands: oldDemands,
              active,
            })
            .where('id', user.id);
        } catch (e) {
          logger.error(`Could not update gestionnaires for ${email} in database`, { error: e });
        }
      }
      stats.totalUpdated++;
      return;
    })
  );

  logger.info(`======== Sync gestionnaires with users`);
  logger.info(`Total created: ${stats.totalCreated}, updated: ${stats.totalUpdated}, deactivated: ${stats.totalDeactivated}`);
  logger.info(`========`);

  return stats;
};

const populateGestionnaireApi = async (account: ApiAccount, networks: ApiNetwork[]) => {
  logDry(`Populate gestionnaires from API`);

  logger.info(`Formatting received data of ${networks.length} networks to process it user per user`);
  const recordsToSync = networks.reduce(
    (acc, network) => {
      network.contacts.forEach((contactEmail) => {
        const networkTag = `${account.name}_${network.id_sncu}`;

        const tagsByEmail = acc[contactEmail] || new Set([]);

        tagsByEmail.add(networkTag);

        acc[contactEmail] = tagsByEmail;
      });
      return acc;
    },
    {} as Record<string, Set<string>>
  );

  const stats = {
    totalCreated: 0,
    totalUpdated: 0,
    totalDeactivated: 0,
    totalUnchanged: 0,
  };

  logger.info(`Reading Data from Airtable ${Airtable.GESTIONNAIRES_API}`);
  const gestionnairesFromAPIRecords = await base(Airtable.GESTIONNAIRES_API).select().all();
  const gestionnairesFromAPI = gestionnairesFromAPIRecords.reduce(
    (acc, gestionnaire) => {
      const email = gestionnaire.get('Email') as string;
      acc[email] = gestionnaire;
      return acc;
    },
    {} as Record<string, (typeof gestionnairesFromAPIRecords)[number]>
  );
  const activeGestionnairesFromAPIEmails = gestionnairesFromAPIRecords
    .filter((gestionnairesFromAPI) => !!gestionnairesFromAPI.get('Encore dans le flux'))
    .map((gestionnairesFromAPI) => gestionnairesFromAPI.get('Email') as string);
  logger.info(`Retrieved ${gestionnairesFromAPIRecords.length} records`);

  if (activeGestionnairesFromAPIEmails.length === 0) {
    logger.error(`No emails found in ${Airtable.GESTIONNAIRES_API}`);
    return;
  }

  const { added, removed, unchanged } = diff(activeGestionnairesFromAPIEmails, Object.keys(recordsToSync));
  logger.info(`Analyzed feed emails: ${added.length} added, ${removed.length} removed, ${unchanged.length} unchanged`);

  logger.info(`Adding: ${added.length} new records to ${Airtable.GESTIONNAIRES_API}`);
  await Promise.all(
    added.map(async (email, emailIndex) => {
      const tags = recordsToSync[email];
      logger.info(`-> ${emailIndex + 1}/${added.length} 🆕 Adding ${email}`);
      logDry(`     Add ${email} to ${Airtable.GESTIONNAIRES_API}`);

      const data = {
        Email: email,
        Nom: account.name,
        Réseaux: Array.from(tags),
        'Encore dans le flux': true,
      };

      stats.totalCreated++;
      if (!DRY_RUN) {
        try {
          await base(Airtable.GESTIONNAIRES_API).create([{ fields: data }], { typecast: true });
        } catch (e) {
          stats.totalCreated = Math.max(stats.totalCreated - 1, 0);
          logger.error(`Could not add ${email} to ${Airtable.GESTIONNAIRES_API} with ${JSON.stringify(data)}`, { error: e });
        }
      }
    })
  );

  logger.info(`Deactivating: ${removed.length} records in ${Airtable.GESTIONNAIRES_API} as they are not in feed anymore`);
  await Promise.all(
    removed.map(async (email, emailIndex) => {
      logger.info(`-> ${emailIndex + 1}/${removed.length} ❌ Deactivating ${email}`);

      logDry(`     Deactivate ${email} in ${Airtable.GESTIONNAIRES_API}`);
      stats.totalDeactivated++;
      if (!DRY_RUN) {
        try {
          await base(Airtable.GESTIONNAIRES_API).update(
            gestionnairesFromAPI[email].id,
            { 'Encore dans le flux': false },
            { typecast: true }
          );
        } catch (e) {
          stats.totalDeactivated = Math.max(stats.totalDeactivated - 1, 0);
          logger.error(`Could not deactivate ${email} in ${Airtable.GESTIONNAIRES_API}`, { error: e });
        }
      }
    })
  );

  logger.info(`Updating: ${unchanged.length} records in ${Airtable.GESTIONNAIRES_API}`);
  await Promise.all(
    unchanged.map(async (email, emailIndex) => {
      const tags = recordsToSync[email];
      const gestionnaireFromAPI = gestionnairesFromAPI[email];
      logger.info(`-> ${emailIndex + 1}/${unchanged.length} Processing contact ${email}`);

      const data = {
        Nom: account.name,
        Réseaux: Array.from(tags),
        'Encore dans le flux': true,
      };

      const existingData = {
        Nom: gestionnaireFromAPI.get('Nom'),
        Réseaux: gestionnaireFromAPI.get('Réseaux') || [],
        'Encore dans le flux': !!gestionnaireFromAPI.get('Encore dans le flux'),
      };

      if (JSON.stringify(data) === JSON.stringify(existingData)) {
        logger.info(`   💤 Nothing to update for ${email}`);
        stats.totalUnchanged++;
        return;
      }

      logger.info(`   🔄 Contact ${email} already exists, update it`);
      logDry(`     Update ${email} with`, JSON.stringify(data));
      stats.totalUpdated++;

      if (!DRY_RUN) {
        try {
          await base(Airtable.GESTIONNAIRES_API).update(gestionnaireFromAPI.id, data, { typecast: true });
        } catch (e) {
          stats.totalUpdated = Math.max(stats.totalUpdated - 1, 0);
          logger.error(`Could not update ${email} to ${Airtable.GESTIONNAIRES_API} with ${JSON.stringify(data)}`, { error: e });
        }
      }
    })
  );

  logger.info(`======== Populate Gestionnaire API`);
  logger.info(
    `Total created: ${stats.totalCreated}, updated: ${stats.totalUpdated}, deactivated: ${stats.totalDeactivated}, unchanged: ${stats.totalUnchanged}`
  );
  logger.info(`========`);
  return stats;
};

const syncGestionnaireAndGestionnaireApi = async (account: ApiAccount) => {
  logDry(`Sync gestionnaires and gestionnaires API`);

  logger.info(`Reading Data from Airtable ${Airtable.GESTIONNAIRES_API}`);
  const gestionnairesFromAPI = await base(Airtable.GESTIONNAIRES_API).select().all();
  logger.info(`Retrieved ${gestionnairesFromAPI.length} records`);

  logger.info(`Reading Data from Airtable ${Airtable.GESTIONNAIRES}`);
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  logger.info(`Retrieved ${gestionnaires.length} records`);

  const stats = {
    totalCreated: 0,
    totalUnchanged: 0,
    totalUpdated: 0,
    totalDeactivated: 0,
  };

  await Promise.all(
    gestionnairesFromAPI.map(async (gestionnaireFromAPI) => {
      const email = gestionnaireFromAPI.get('Email') as string;
      const active = !!gestionnaireFromAPI.get('Encore dans le flux');
      const tagsFromAPI = (gestionnaireFromAPI.get('Réseaux') as string[]) || [];

      const existingGestionnaire = gestionnaires.find(
        (gestionnaire) => (gestionnaire.get('Email') as string).toLowerCase() === email.toLowerCase()
      );

      if (!existingGestionnaire) {
        const data = {
          Email: email,
          "Créé depuis l'API": account.name,
          Actif: active,
          'Réseaux API': tagsFromAPI,
          'Nouvelle demande': true,
          Relance: true,
        };
        logger.info(`   🆕 Contact ${email} does not exist, create it`);
        logDry(`     Create ${email} with`, JSON.stringify(data));
        stats.totalCreated++;
        if (!DRY_RUN) {
          try {
            await base(Airtable.GESTIONNAIRES).create([{ fields: data }], { typecast: true });
          } catch (e) {
            stats.totalCreated = Math.max(stats.totalCreated - 1, 0);
            logger.error(`Could not add ${email} to ${Airtable.GESTIONNAIRES} with ${JSON.stringify(data)}`, { error: e });
          }
        }
        return;
      }

      if (!existingGestionnaire.get('Actif')) {
        logger.info(`   💤 Skipping ${email} as it is not active`);
        stats.totalUnchanged++;
        return;
      }

      if (!active) {
        logger.info(`   ❌ Deactivating ${email} as it is not in feed anymore`);
        logDry(`     Deactivate ${email}`);
        stats.totalDeactivated++;
        if (!DRY_RUN) {
          try {
            await base(Airtable.GESTIONNAIRES).update(existingGestionnaire.id, { Actif: false }, { typecast: true });
          } catch (e) {
            stats.totalDeactivated = Math.max(stats.totalDeactivated - 1, 0);
            logger.error(`Could not deactivate ${email} to ${Airtable.GESTIONNAIRES}`, { error: e });
          }
        }
      }

      const data = {
        'Réseaux API': tagsFromAPI,
      };
      const existingData = {
        'Réseaux API': existingGestionnaire.get('Réseaux API') || [],
      };

      if (JSON.stringify(data) === JSON.stringify(existingData)) {
        logger.info(`   💤 Nothing to update for ${email}`);
        return;
      }

      logDry(`     Update ${email} (${existingGestionnaire.id}) with`, JSON.stringify(data));
      stats.totalUpdated++;
      if (!DRY_RUN) {
        try {
          await base(Airtable.GESTIONNAIRES).update(existingGestionnaire.id, data, { typecast: true });
        } catch (e) {
          stats.totalUpdated = Math.max(stats.totalUpdated - 1, 0);
          logger.error(`Could not update ${email} to ${Airtable.GESTIONNAIRES} with ${JSON.stringify(data)}`, { error: e });
        }
      }
    })
  );

  logger.info(`======== Sync Gestionnaire and Gestionaire API`);
  logger.info(`Total created: ${stats.totalCreated}, updated: ${stats.totalUpdated}, deactivated: ${stats.totalDeactivated}`);
  logger.info(`========`);
};

export const sanitizeGestionnairesEmails = async () => {
  const stats = {
    sanitizedGestionnaireEmails: 0,
  };
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  logger.info(`Sanitize ${gestionnaires.length} gestionnaire emails`);

  await Promise.all(
    gestionnaires.map(async (gestionnaire) => {
      const email = gestionnaire.get('Email') as string;
      if (!email) return false;
      const sanitizedEmail = sanitizeEmail(email);
      if (sanitizedEmail !== email) {
        logger.info(`Sanitizing "${email}" for "${sanitizedEmail}"`);
        if (!DRY_RUN) {
          await base(Airtable.GESTIONNAIRES).update(gestionnaire.id, { Email: sanitizedEmail });
        }
        if (email.toLowerCase() !== sanitizedEmail.toLowerCase()) {
          stats.sanitizedGestionnaireEmails++;
        }
      }

      return;
    })
  );
  logger.info(`========`);
  logger.info(`Total sanitized: ${stats.sanitizedGestionnaireEmails}`);
  logger.info(`========`);

  return stats;
};

export const createGestionnairesFromAPI = async (account: ApiAccount, networks: ApiNetwork[]) => {
  await sanitizeGestionnairesEmails();
  await populateGestionnaireApi(account, networks);
  await syncGestionnaireAndGestionnaireApi(account);
};
