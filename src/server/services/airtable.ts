import bcrypt from 'bcryptjs';

import db from '@/server/db';
import base from '@/server/db/airtable';
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

      if (!DRY_RUN) {
        logDry(`    ✅ Update gestionnaires for ${email}`);

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

        const object = acc[contactEmail] || {
          email: contactEmail,
          tags: new Set([]),
        };

        object.tags.add(networkTag);

        acc[contactEmail] = object;
      });
      return acc;
    },
    {} as Record<string, { email: string; tags: Set<string> }>
  );

  const stats = {
    totalCreated: 0,
    totalUpdated: 0,
    totalDeactivated: 0,
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
      const { tags } = recordsToSync[email];
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
      const { tags } = recordsToSync[email];
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

  logger.info(`========`);
  logger.info(`Total created: ${stats.totalCreated}, updated: ${stats.totalUpdated}, deactivated: ${stats.totalDeactivated}`);
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
    totalSkipped: 0,
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
        stats.totalSkipped++;
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

      const tagsNotFromAPI = diff(tagsFromAPI, (existingGestionnaire.get('Réseaux') as string[]) || []).added;

      const data = {
        ...(process.env.FIRST_TIME_FIX === 'true' ? { Réseaux: tagsNotFromAPI } : {}),
        'Réseaux API': tagsFromAPI,
      };
      const existingData = {
        ...(process.env.FIRST_TIME_FIX === 'true' ? { Réseaux: existingGestionnaire.get('Réseaux') || [] } : {}),
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

  logger.info(`========`);
  logger.info(`Total created: ${stats.totalCreated}, updated: ${stats.totalUpdated}, deactivated: ${stats.totalDeactivated}`);
  logger.info(`========`);
};

export const cleanGestionnaireTags = async () => {
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  await Promise.all(
    gestionnaires.map(async (gestionnaire) => {
      const tags = (gestionnaire.get('Réseaux') as string[]) || [];
      const tagsAPI = (gestionnaire.get('Réseaux API') as string[]) || [];
      const tagsNotFromAPI = diff(tagsAPI, tags).added;
      await base(Airtable.GESTIONNAIRES).update(gestionnaire.id, { Réseaux: tagsNotFromAPI });
    })
  );
};

/**
 * To be called only once and then archived
 */
export const activateAllGestionnaires = async () => {
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  const inactiveGestionnaires = gestionnaires.filter((gestionnaire) => !gestionnaire.get('Actif'));
  logger.info(`Activate ${inactiveGestionnaires.length} gestionnaires`);
  await Promise.all(
    inactiveGestionnaires.map(async (gestionnaire) => {
      await base(Airtable.GESTIONNAIRES).update(gestionnaire.id, { Actif: true });
    })
  );

  const gestionnairesApi = await base(Airtable.GESTIONNAIRES_API).select().all();
  const inactiveGestionnairesApi = gestionnairesApi.filter((gestionnaire) => !gestionnaire.get('Encore dans le flux'));
  logger.info(`Activate ${inactiveGestionnairesApi.length} gestionnaires API`);
  await Promise.all(
    inactiveGestionnairesApi.map(async (gestionnaire) => {
      await base(Airtable.GESTIONNAIRES_API).update(gestionnaire.id, { 'Encore dans le flux': true });
    })
  );
};

/**
 * To be called only once and then archived
 */
export const updateCreatedTimeInDB = async () => {
  const gestionnaires = await base(Airtable.GESTIONNAIRES).select().all();
  const users = await db('users').select('email', 'created_at').where('role', USER_ROLE.GESTIONNAIRE);

  const gestionnairesToUpdate = gestionnaires.filter((gestionnaire) => !gestionnaire.get('Créé en base'));
  logger.info(`Get created time for ${gestionnairesToUpdate.length} gestionnaires`);

  await Promise.all(
    gestionnairesToUpdate.map(async (gestionnaire, index) => {
      logger.info(`${index + 1}/${gestionnairesToUpdate.length} Getting creation date for ${gestionnaire.get('Email')}`);
      const email = gestionnaire.get('Email') as string;

      if (!email) {
        logger.error(`No email for ${gestionnaire.id}`);
      } else {
        logger.info(`Adding creation date in DB for ${email}`);
        const user = users.find((user) => user.email === email);
        try {
          await base(Airtable.GESTIONNAIRES).update(gestionnaire.id, { 'Créé en base': user?.created_at });
        } catch (e) {
          logger.error(`Could not update with created at ${gestionnaire.id} from ${Airtable.GESTIONNAIRES}`);
        }
      }
    })
  );
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

  if (process.env.FIRST_TIME_FIX === 'true') {
    await activateAllGestionnaires();
    await updateCreatedTimeInDB();
  }
  await populateGestionnaireApi(account, networks);
  await syncGestionnaireAndGestionnaireApi(account);

  if (process.env.FIRST_TIME_FIX === 'true') {
    await cleanGestionnaireTags();
  }
};
