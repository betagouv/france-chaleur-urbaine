import { faker } from '@faker-js/faker';
import * as Sentry from '@sentry/nextjs';
import { TRPCError } from '@trpc/server';
import type { Insertable, Selectable } from 'kysely';
import type { User } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

import { clientConfig } from '@/client-config';
import {
  type CreateBatchDemandInput,
  type CreateDemandInput,
  demandStatusDefault,
  formatDataToLegacyAirtable,
  normalizeHeatingEnergy,
  normalizeHeatingType,
  type UpdateDemandInput,
} from '@/modules/demands/constants';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import { createEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import {
  type DemandEmails,
  type Demands,
  kdb,
  type ProEligibilityTestsAddresses,
  type ReseauxDeChaleur,
  sql,
  type Users,
  type ZonesEtReseauxEnConstruction,
} from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import { type EligibilityType, getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import type { UserRole } from '@/types/enum/UserRole';
import type { FrontendType } from '@/utils/typescript';

import * as assignmentRulesService from './assignment-rules-service';

const logger = parentLogger.child({
  module: 'demands',
});

export const tableName = 'demands';
export const emailsTableName = 'demand_emails';
const baseModel = createBaseModel(tableName);

const augmentAdminDemand = <T extends Selectable<Demands>>({
  demand,
  testAddress,
}: {
  demand: T;
  testAddress: Selectable<ProEligibilityTestsAddresses> | null;
}) => {
  const augmentedDemand = augmentGestionnaireDemand({ demand, testAddress });

  augmentedDemand['Gestionnaires validés'] ??= false;
  augmentedDemand['Relance à activer'] ??= false;

  return augmentedDemand;
};

const getEntityFromType = (type: EligibilityType) => {
  switch (type) {
    case 'dans_pdp_reseau_futur':
    case 'dans_pdp_reseau_existant':
      return 'PDP';
    case 'reseau_existant_proche':
    case 'reseau_existant_tres_proche':
    case 'reseau_existant_loin':
    case 'dans_ville_reseau_existant_sans_trace':
      return 'ReseauDeChaleur';
    case 'dans_zone_reseau_futur':
    case 'reseau_futur_tres_proche':
    case 'reseau_futur_loin':
    case 'reseau_futur_proche':
      return 'ReseauEnConstruction';
    default:
      return null;
  }
};

const augmentGestionnaireDemand = <T extends Selectable<Demands>>({
  demand: { legacy_values, ...demand },
  testAddress,
}: {
  demand: T;
  testAddress: Selectable<ProEligibilityTestsAddresses> | null;
}) => {
  const history = testAddress?.eligibility_history as ProEligibilityTestHistoryEntry[] | undefined;
  const augmentedHistory = (history || []).map((entry) => {
    return {
      ...entry,
      eligibility: {
        ...entry.eligibility,
        entity: getEntityFromType(entry.eligibility?.type),
      },
    };
  });

  const lastEligibility = augmentedHistory?.[augmentedHistory.length - 1];
  legacy_values['en PDP'] = lastEligibility?.eligibility?.type.includes('dans_pdp') ? 'Oui' : 'Non';
  legacy_values['Prise de contact'] ??= false;
  legacy_values.Status ??= demandStatusDefault;

  // Normalisation des valeurs de chauffage legacy
  const rawHeatingEnergy = legacy_values['Mode de chauffage'];
  if (rawHeatingEnergy) {
    const normalizedHeatingEnergy = normalizeHeatingEnergy(rawHeatingEnergy);
    if (normalizedHeatingEnergy) {
      legacy_values['Mode de chauffage'] = normalizedHeatingEnergy;
    } else {
      Sentry.captureMessage(`Valeur "Mode de chauffage" non reconnue: "${rawHeatingEnergy}"`, {
        extra: { demandId: demand.id, rawValue: rawHeatingEnergy },
        level: 'error',
      });
    }
  }

  const rawHeatingType = legacy_values['Type de chauffage'];
  if (rawHeatingType) {
    const normalizedHeatingType = normalizeHeatingType(rawHeatingType);
    if (normalizedHeatingType) {
      legacy_values['Type de chauffage'] = normalizedHeatingType;
    } else {
      Sentry.captureMessage(`Valeur "Type de chauffage" non reconnue: "${rawHeatingType}"`, {
        extra: { demandId: demand.id, rawValue: rawHeatingType },
        level: 'error',
      });
    }
  }

  const isParis = legacy_values.Gestionnaires?.includes('Paris');
  const distanceThreshold = isParis ? 60 : 100;
  const isHautPotentiel =
    legacy_values['Type de chauffage'] === 'Collectif' &&
    ((legacy_values['Distance au réseau'] || 10000000) < distanceThreshold ||
      (legacy_values.Logement || 0) >= 100 ||
      legacy_values.Structure === 'Tertiaire');

  // complète les valeurs par défaut pour simplifier l'usage côté UI

  return {
    haut_potentiel: isHautPotentiel,
    ...legacy_values,
    ...demand,
    testAddress: {
      ...testAddress,
      eligibility: lastEligibility?.eligibility,
      eligibility_history: augmentedHistory,
    },
  };
};

export const update = async (recordId: string, { comment_fcu, comment_gestionnaire, ...values }: UpdateDemandInput, userId?: string) => {
  // Get current demand before update to detect changes
  const currentDemand = await kdb.selectFrom(tableName).selectAll().where('id', '=', recordId).executeTakeFirst();

  // Check if 'Gestionnaire Affecté à' has changed
  const oldAssignment = currentDemand?.legacy_values['Gestionnaire Affecté à'];
  const newAssignment = values['Gestionnaire Affecté à'];

  if (
    values['Affecté à'] &&
    currentDemand?.legacy_values['Gestionnaire Affecté à'] &&
    values['Affecté à'] !== currentDemand?.legacy_values['Affecté à'] &&
    values['Affecté à'] === oldAssignment
  ) {
    // Affectation a changé, on reset le gestionnaire affecté à
    values['Gestionnaire Affecté à'] = null as any;
  }

  const [updatedDemand] = await kdb
    .updateTable(tableName)
    .set({
      ...(comment_fcu && { comment_fcu }),
      ...(comment_gestionnaire && { comment_gestionnaire }),
      legacy_values: sql`legacy_values || ${JSON.stringify(values)}::jsonb`, // The || operator merges the two JSONB objects, with the new values overwriting any matching keys.
      updated_at: new Date(),
    })
    .where('id', '=', recordId)
    .returningAll()
    .execute();

  if (newAssignment && oldAssignment !== newAssignment) {
    // Automation import from https://airtable.com/app9opX8gRAtBqkan/wfloOFXhfUKvhL2Qc
    await sendEmailTemplate(
      'demands.admin-assignment-change',
      { email: clientConfig.destinationEmails.pro },
      { demand: updatedDemand.legacy_values, newAssignment }
    ).catch((error: unknown) => {
      logger.error('Failed to send assignment change email:', error);
    });
  }

  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .selectAll()
    .where('demand_id', '=', updatedDemand.id)
    .executeTakeFirst();

  if (userId) {
    await createUserEvent({
      author_id: userId,
      context_id: recordId,
      context_type: 'demand',
      data: values,
      type: 'demand_updated',
    });
  } else {
    await createEvent({
      context_id: recordId,
      context_type: 'demand',
      data: values,
      type: 'demand_updated',
    });
  }
  const demand = await get(updatedDemand.id);
  if (!demand) {
    throw new Error('Demand not found');
  }

  return augmentAdminDemand({ demand, testAddress: testAddress || null });
};

export const create = async (
  values: CreateDemandInput,
  { userId, pro_eligibility_tests_addresse_id }: { userId?: string; pro_eligibility_tests_addresse_id?: string } = {}
) => {
  let testAddressFromDB: Omit<Selectable<ProEligibilityTestsAddresses>, 'eligibility_history'> | null = null;

  const { lat, lon } = values.coords;
  const legacyValues = formatDataToLegacyAirtable(values);

  const [conso, nbLogement] = await Promise.all([
    getConsommationGazAdresse(lat, lon),
    values.nbLogements ? { batiment_groupe_id: undefined, nb_logements: values.nbLogements } : getNbLogement(lat, lon),
  ]);

  const [createdDemand] = await kdb
    .insertInto(tableName)
    .values({
      created_at: new Date(),
      legacy_values: sql<string>`${JSON.stringify({
        ...legacyValues,
        'Affecté à': null,
        Conso: conso ? conso.conso_nb : undefined,
        'Date de la demande': new Date().toISOString(),
        Gestionnaires: null,
        'Gestionnaires validés': false,
        'ID BNB': nbLogement?.batiment_groupe_id ? `${nbLogement.batiment_groupe_id}` : undefined,
        'ID réseau le plus proche': null,
        Logement: nbLogement?.nb_logements ? nbLogement.nb_logements : undefined,
      })}::jsonb`,
      updated_at: new Date(),
      user_id: userId ?? null,
    })
    .returningAll()
    .execute();

  if (pro_eligibility_tests_addresse_id) {
    const updatedTestAddress = await kdb
      .updateTable('pro_eligibility_tests_addresses')
      .set({ demand_id: createdDemand.id })
      .returningAll()
      .where('id', '=', pro_eligibility_tests_addresse_id)
      .executeTakeFirst();
    if (updatedTestAddress) {
      testAddressFromDB = updatedTestAddress;
    }
  } else if (lat && lon) {
    const createdTestAddress = await createEligibilityTestAddress({
      address: values.address,
      demand_id: createdDemand.id,
      latitude: lat,
      longitude: lon,
    });
    if (createdTestAddress) {
      testAddressFromDB = createdTestAddress;
    }
  }

  const testAddress = testAddressFromDB as Selectable<ProEligibilityTestsAddresses> & {
    eligibility_history: ProEligibilityTestHistoryEntry[];
  };

  await Promise.all([
    createEvent({
      context_id: createdDemand.id,
      context_type: 'demand',
      data: values,
      type: 'demand_created',
    }),
    sendEmailTemplate(
      'demands.user-new',
      { email: values.email },
      {
        demand: {
          ...legacyValues,
          'Distance au réseau':
            (testAddress?.eligibility_history || [])[(testAddress?.eligibility_history?.length || 1) - 1]?.eligibility?.distance ?? 9999,
          Structure: legacyValues.Structure as any,
          'Type de chauffage': legacyValues['Type de chauffage'] as 'Collectif' | 'Autre / Je ne sais pas' | 'Individuel',
        },
      } // si > 1000m la distance est null, or le template veut une distance
    ),
    // Automation import from https://airtable.com/app9opX8gRAtBqkan/wflvqEW0CLeXZ2pO0
    sendEmailTemplate('demands.admin-new', { email: clientConfig.destinationEmails.contact }, { demand: legacyValues as any }),
  ]);

  const demand = await get(createdDemand.id);

  if (!demand) {
    throw new Error('Demand not found');
  }

  return augmentAdminDemand({ demand, testAddress });
};

/**
 * Create multiple demands from test addresses
 * User info is fetched from the users table
 * @param input - Batch demand creation input with addresses and heatingType
 * @param userId - ID of the user creating the demands (required)
 * @returns Array of objects with addressId and demandId for each created demand
 */
export const createBatch = async (
  input: CreateBatchDemandInput,
  userId: string
): Promise<Array<{ addressId: string; demandId: string }>> => {
  const { addresses } = input;

  // Fetch user info from users table
  const user = await kdb
    .selectFrom('users')
    .select(['email', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();

  const results = await Promise.all(
    addresses.map(async (addressData) => {
      const testAddress = await kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .select(['ban_address', 'demand_id', sql<GeoJSON.Point>`ST_AsGeoJSON(st_transform(geom, 4326))::json`.as('geom')])
        .where('id', '=', addressData.addressId)
        .executeTakeFirst();

      if (testAddress?.demand_id) {
        return { addressId: addressData.addressId, demandId: testAddress.demand_id };
      }

      const coords = {
        lat: testAddress?.geom?.coordinates[1] as number,
        lon: testAddress?.geom?.coordinates[0] as number,
      };
      const eligibility = await getDetailedEligibilityStatus(coords.lat, coords.lon);

      const result = await create(
        {
          address: testAddress?.ban_address || '',
          city: eligibility.commune.nom || '',
          company: user.structure_name || '',
          companyType: user.structure_type || '',
          coords,
          demandCompanyName: user.structure_name || '',
          demandCompanyType: user.structure_type || '',
          department: eligibility.departement.nom as string,
          eligibility: {
            distance: eligibility.distance,
            inPDP: !!eligibility.pdp?.id_fcu,
            isEligible: eligibility.eligible,
          },
          email: user.email,
          firstName: user.first_name || '',
          heatingEnergy: addressData.heatingEnergy,
          heatingType: addressData.heatingType,
          lastName: user.last_name || '',
          phone: user.phone || '',
          postcode: '',
          region: eligibility.region.nom as string,
          structure: user.structure_type || '',
          termOfUse: true,
        },
        { pro_eligibility_tests_addresse_id: addressData.addressId, userId }
      );
      return { addressId: addressData.addressId, demandId: result.id };
    })
  );
  return results;
};

export const remove = async (demandId: string, userId?: string) => {
  await baseModel.remove(demandId);

  if (userId) {
    await createUserEvent({
      author_id: userId,
      context_id: demandId,
      context_type: 'demand',
      type: 'demand_deleted',
    });
  } else {
    await createEvent({
      context_id: demandId,
      context_type: 'demand',
      type: 'demand_deleted',
    });
  }
};

type DemandForPermissionCheck = {
  user_id: string | null;
  legacy_values: AirtableLegacyRecord;
};

type PermissionDefinition = boolean | ((params: { user: User; demand: DemandForPermissionCheck }) => boolean);

const demandEmailAccessPermissions: Record<UserRole, PermissionDefinition> = {
  admin: true,
  demo: true,
  gestionnaire: ({ user, demand }) =>
    !!(
      demand.legacy_values['Gestionnaires validés'] && demand.legacy_values.Gestionnaires?.some((tag) => user.gestionnaires?.includes(tag))
    ),
  particulier: ({ user, demand }) => demand.user_id === user.id,
  professionnel: ({ user, demand }) => demand.user_id === user.id,
};

/**
 * Ensure the user has permissions to access the demand emails
 */
const ensureEmailsPermissions = async ({ user, demandId }: { demandId: string; user: User }) => {
  const demand = await kdb.selectFrom('demands').select(['user_id', 'legacy_values']).where('id', '=', demandId).executeTakeFirstOrThrow();
  const permissionsCheck = demandEmailAccessPermissions[user.role];
  if (!(typeof permissionsCheck === 'boolean' ? permissionsCheck : permissionsCheck({ demand, user }))) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Unauthorized',
    });
  }
};

export const listEmails = async ({ demandId, user }: { demandId: string; user: User }) => {
  await ensureEmailsPermissions({ demandId, user });
  return await kdb.selectFrom('demand_emails').selectAll().where('demand_id', '=', demandId).execute();
};

export const createEmail = async (values: Omit<Insertable<DemandEmails>, 'created_at' | 'updated_at' | 'id'>) => {
  const [createdEmail] = await kdb
    .insertInto('demand_emails')
    .values({ ...values, created_at: new Date(), sent_at: new Date(), updated_at: new Date() })
    .returningAll()
    .execute();
  return createdEmail;
};

export const sendEmail = async (params: {
  demand_id: string;
  emailContent: {
    body: string;
    cc: string[];
    object: string;
    replyTo: string;
    signature: string;
    to: string;
  };
  key: string;
  user: User;
}) => {
  const { demand_id, emailContent, key, user } = params;

  // Create email record
  await createEmail({
    body: emailContent.body,
    cc: emailContent.cc.join(',') || '',
    demand_id,
    email_key: key,
    object: emailContent.object,
    reply_to: emailContent.replyTo,
    signature: emailContent.signature,
    to: emailContent.to,
    user_email: user.email,
  });

  // Update user signature if changed
  if (user.signature !== emailContent.signature) {
    await kdb.updateTable('users').set({ signature: emailContent.signature }).where('email', '=', user.email).execute();
  }

  // Send email
  await sendEmailTemplate(
    'demands.custom-email',
    { email: emailContent.to, id: user.id },
    {
      content: emailContent.body,
      signature: emailContent.signature,
    },
    {
      cc: emailContent.cc,
      replyTo: emailContent.replyTo,
      subject: emailContent.object,
    }
  );
};

export const updateFromRelanceId = async (relanceId: string, values: UpdateDemandInput, userId?: string) => {
  const relanceDemand = await kdb
    .selectFrom(tableName)
    .selectAll()
    .where(sql`legacy_values->>'Relance ID'`, '=', relanceId)
    .executeTakeFirst();

  if (!relanceDemand) {
    throw new Error(`Relance demand not found for relance ID: ${relanceId}`);
  }

  return update(relanceDemand.id, values, userId);
};

export const updateCommentFromRelanceId = async (relanceId: string, comment: string, userId?: string) => {
  return updateFromRelanceId(relanceId, { 'Commentaire relance': comment }, userId);
};

export const updateSatisfactionFromRelanceId = async (relanceId: string, satisfaction: boolean) => {
  const demand = await updateFromRelanceId(relanceId, { 'Recontacté par le gestionnaire': satisfaction ? 'Oui' : 'Non' });

  // Automation import from  https://airtable.com/app9opX8gRAtBqkan/wfl3jPABYXeIrGeUr/wtrWn0m6O5tXFFdiP
  if (demand.Structure === 'Bailleur social' || demand.Structure === 'Tertiaire') {
    await sendEmailTemplate('demands.admin-gestionnaire-contact', { email: clientConfig.destinationEmails.pro }, { demand }).catch(
      (error: unknown) => {
        logger.error('Failed to send gestionnaire contact email:', error);
      }
    );
  }
  return demand;
};

export const getAllToRelanceDemands = async () => {
  const records = await kdb
    .selectFrom('demands')
    .selectAll()
    .where((eb) =>
      eb.or([
        eb.and([
          eb(sql`(legacy_values->>'Date de la demande')::date`, '<', sql`NOW() - INTERVAL '1 month'`),
          eb(sql`legacy_values->>'Relance à activer'`, '=', true),
          eb.or([
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, '=', ''),
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, 'is', null),
          ]),
          eb.or([eb(sql`legacy_values->>'Relance envoyée'`, '=', ''), eb(sql`legacy_values->>'Relance envoyée'`, 'is', null)]),
        ]),
        eb.and([
          eb(sql`(legacy_values->>'Date de la demande')::date`, '<', sql`NOW() - INTERVAL '45 days'`),
          eb.or([
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, '=', ''),
            eb(sql`legacy_values->>'Recontacté par le gestionnaire'`, 'is', null),
          ]),
          eb(sql`legacy_values->>'Relance à activer'`, '=', true),
          eb(sql`legacy_values->>'Relance envoyée'`, '!=', ''),
          eb(sql`legacy_values->>'Relance envoyée'`, 'is not', null),
          eb.or([
            eb(sql`legacy_values->>'Seconde relance envoyée'`, '=', ''),
            eb(sql`legacy_values->>'Seconde relance envoyée'`, 'is', null),
          ]),
        ]),
      ])
    )
    .execute();

  return records.map((record) => ({ id: record.id, ...record.legacy_values }));
};
/**
 * Envoie des relances aux utilisateurs s'ils n'ont pas été recontactés par le gestionnaire
 * après 1 mois pour la première relance
 * puis 15 jours plus tard pour la seconde relance
 */
export const dailyRelanceMail = async () => {
  const demands = await getAllToRelanceDemands();

  for (const demand of demands) {
    const relanced = demand['Relance envoyée'];
    const uuid = uuidv4();
    await update(demand.id, {
      [relanced ? 'Seconde relance envoyée' : 'Relance envoyée']: new Date().toDateString(),
      'Relance ID': uuid,
    });
    await sendEmailTemplate(
      'demands.user-relance',
      { email: demand.Mail, id: demand.id },
      {
        adresse: demand.Adresse,
        date: new Date(demand['Date de la demande']).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        firstName: demand.Prénom ?? '',
        relanceId: uuid,
      }
    );
  }
};

const buildDemandQuery = () => {
  return kdb
    .selectFrom('demands')
    .innerJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests_addresses.demand_id', 'demands.id')
    .selectAll('demands')
    .select(sql.raw<Selectable<ProEligibilityTestsAddresses>>(`to_jsonb(pro_eligibility_tests_addresses)`).as('testAddress'));
};

export const get = async (demandId: string) => {
  return buildDemandQuery().where('demands.id', '=', demandId).executeTakeFirst();
};

export const listAdmin = async () => {
  let startTime = Date.now();

  const records = await buildDemandQuery().orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute();

  const { count } = await kdb.selectFrom('demands').select(kdb.fn.count<number>('id').as('count')).executeTakeFirstOrThrow();

  logger.info('kdb.getAdminDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });

  // Récupére et parse les règles et leurs résultats
  const { items: assignmentRules } = await assignmentRulesService.listActive();
  const parsedRules = await assignmentRulesService.parseAssignmentRules(assignmentRules);

  const [reseauxDeChaleur, reseauxEnConstruction] = await Promise.all([
    kdb.selectFrom('reseaux_de_chaleur').select(['tags', 'id_fcu', 'communes']).execute(),
    kdb.selectFrom('zones_et_reseaux_en_construction').select(['tags', 'id_fcu', 'communes']).execute(),
  ]);

  startTime = Date.now();
  const demands = (
    await Promise.all(
      records.map(async (record) => {
        const { testAddress, ...demand } = record;
        const legacyValues = record.legacy_values;

        if (!legacyValues.Latitude || !legacyValues.Longitude || !legacyValues.Ville) {
          logger.warn('missing demand fields', {
            demandId: demand.id,
            missingFields: ['Latitude', 'Longitude', 'Ville'],
          });
          return null;
        }

        const augmentedDemand = augmentAdminDemand({
          demand,
          testAddress,
        });

        if (augmentedDemand['Gestionnaires validés']) {
          return {
            ...augmentedDemand,
            recommendedAssignment: '',
            recommendedTags: [],
            testAddress: {
              ...augmentedDemand.testAddress,
              eligibility: {
                ...augmentedDemand.testAddress.eligibility,
                communes: [],
              },
            },
          };
        }

        const detailedEligibility = await getDetailedEligibilityStatus(augmentedDemand.Latitude!, augmentedDemand.Longitude!);
        const rulesResult = assignmentRulesService.applyParsedRulesToEligibilityData(parsedRules, detailedEligibility);

        return {
          ...augmentedDemand,
          recommendedAssignment: rulesResult.assignment ?? 'Non affecté',
          recommendedTags: [...new Set([...detailedEligibility.tags, ...rulesResult.tags])],
          testAddress: {
            ...augmentedDemand.testAddress,
            eligibility: {
              ...augmentedDemand.testAddress.eligibility,
              communes: detailedEligibility.communes,
            },
          },
        };
      })
    )
  ).filter((v) => v !== null);

  logger.info('getDetailedEligilityStatus', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });

  return { count, items: demands };
};

export const list = async (user: User) => {
  if (!user || !user.gestionnaires) {
    return [];
  }

  const startTime = Date.now();

  // Build query based on user role and gestionnaires
  const records = await buildDemandQuery()
    .$if(user.role === 'demo', (qb) =>
      qb
        .where(sql`legacy_values->>'Gestionnaires validés'`, '=', 'true')
        .where(sql`legacy_values->'Gestionnaires'`, '?|', sql.val(['Paris']))
    )
    .$if(user.role === 'gestionnaire', (qb) =>
      qb
        .where(sql`legacy_values->>'Gestionnaires validés'`, '=', 'true')
        .where(sql`legacy_values->'Gestionnaires'`, '?|', sql.val(user.gestionnaires))
    )
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  logger.info('kdb.getDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
    tagsCounts: user.gestionnaires.length,
  });
  const demands = records.map(({ testAddress, ...demand }) => augmentGestionnaireDemand({ demand, testAddress }));

  return user.role === 'demo'
    ? demands.map((demand) => ({
        ...demand,
        Mail: faker.internet.email(),
        Nom: faker.person.lastName(),
        Prénom: faker.person.firstName(),
        Téléphone: `0${faker.string.numeric(9)}`,
      }))
    : demands;
};

export const listByUser = async (userId: string) => {
  const startTime = Date.now();

  const records = await buildDemandQuery()
    .select((eb) =>
      eb
        .selectFrom('demand_emails')
        .select(eb.fn.count<number>('id').as('count'))
        .whereRef('demand_emails.demand_id', '=', 'demands.id')
        .as('email_count')
    )
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  logger.info('kdb.listByUser', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
    userId,
  });

  const demands = records.map(({ testAddress, email_count, ...demand }) => ({
    ...augmentGestionnaireDemand({
      demand,
      testAddress,
    }),
    email_count: Number(email_count) || 0,
  }));

  return demands;
};

export const linkDemandsByEmail = async (userId: string, email: string): Promise<number> => {
  const result = await kdb
    .updateTable('demands')
    .set({ user_id: userId })
    .where('user_id', 'is', null) // Only link unlinked demands
    .where(sql`LOWER(legacy_values->>'Mail')`, '=', email.toLowerCase())
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  return Number(result.numUpdatedRows ?? 0);
};

export const buildFeatures = async (properties: string[]) => {
  const records = await kdb.selectFrom('demands').selectAll().execute();

  const features = records.map((record) => {
    const longitude = record.legacy_values.Longitude ?? 0;
    const latitude = record.legacy_values.Latitude ?? 0;
    return {
      geometry: {
        coordinates: [longitude, latitude],
        type: 'Point',
      },
      properties: properties!.reduce(
        (acc: any, key) => {
          const value = record.legacy_values[key as keyof AirtableLegacyRecord];
          if (value) {
            acc[key] = value;
          }
          return acc;
        },
        { id: record.id }
      ),
      type: 'Feature',
    } satisfies GeoJSON.Feature<GeoJSON.Geometry>;
  });
  return features;
};

export const getConsommationGazAdresse = async (lat: number, lon: number) => {
  const result = await kdb
    .selectFrom('donnees_de_consos')
    .select('conso_nb')
    .where(
      sql<boolean>`
        ST_INTERSECTS(
          ST_Transform(${sql.raw(`'SRID=4326;POINT(${lon} ${lat})'::geometry`)}, 2154),
          ST_BUFFER(geom, 3.5)
        )
      `
    )
    .executeTakeFirst();
  return result;
};

export const getNbLogement = async (lat: number, lon: number) => {
  const result = await kdb
    .selectFrom('bdnb_batiments')
    .select(['batiment_groupe_id', 'ffo_bat_nb_log as nb_logements'])
    .where(
      sql.raw<boolean>(`
      ST_DWithin(
        geom,
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
        3.5
      )
    `)
    )
    .executeTakeFirst();
  return result;
};

type Stats = {
  total: number;
  pending: number;
};

/**
 * Retourne les informations et stats par tags de gestionnaires : utilisateurs, réseaux, stats de demandes des derniers mois.
 */
export const getTagsStats = async () => {
  const tagsStats = await kdb
    .with('reseaux_par_tag', (eb) =>
      eb
        .selectFrom('reseaux_de_chaleur')
        .select((eb) => [
          eb.fn('unnest', [eb.ref('tags')]).as('tag'),
          sql`
            json_agg(
              json_build_object(
                'id_fcu', id_fcu,
                'Identifiant reseau', "Identifiant reseau",
                'nom_reseau', nom_reseau
              )
            )
          `.as('json'),
        ])
        .groupBy(['tag'])
    )
    .with('reseaux_construction_par_tag', (eb) =>
      eb
        .selectFrom('zones_et_reseaux_en_construction')
        .select((eb) => [
          eb.fn('unnest', [eb.ref('tags')]).as('tag'),
          sql`
            json_agg(
              json_build_object(
                'id_fcu', id_fcu,
                'nom_reseau', nom_reseau,
                'is_zone', is_zone
              )
            )
          `.as('json'),
        ])
        .groupBy(['tag'])
    )
    .selectFrom('tags as t')
    .leftJoin('reseaux_par_tag as r', (join) => join.onRef('r.tag', '=', 't.name'))
    .leftJoin('reseaux_construction_par_tag as rc', (join) => join.onRef('rc.tag', '=', 't.name'))
    .leftJoin('tags_reminders as tr', (join) => join.onRef('tr.tag_id', '=', 't.id'))
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom('demands')
          .select(
            sql
              .raw<{
                total: Stats;
                lastThreeMonths: Stats;
                lastSixMonths: Stats;
              }>(`
                jsonb_build_object(
                  'total', jsonb_build_object(
                    'total', COUNT(*),
                    'pending', COUNT(*) FILTER (
                      WHERE COALESCE(legacy_values->>'Status', '${DEMANDE_STATUS.EMPTY}') = '${DEMANDE_STATUS.EMPTY}'
                        AND COALESCE((legacy_values->>'Prise de contact')::boolean, false) = false
                    )
                  ),
                  'lastThreeMonths', jsonb_build_object(
                    'total', COUNT(*) FILTER (WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '3 months'),
                    'pending', COUNT(*) FILTER (
                      WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '3 months'
                        AND COALESCE(legacy_values->>'Status', '${DEMANDE_STATUS.EMPTY}') = '${DEMANDE_STATUS.EMPTY}'
                        AND COALESCE((legacy_values->>'Prise de contact')::boolean, false) = false
                    )
                  ),
                  'lastSixMonths', jsonb_build_object(
                    'total', COUNT(*) FILTER (WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '6 months'),
                    'pending', COUNT(*) FILTER (
                      WHERE (legacy_values->>'Date de la demande')::date >= NOW() - INTERVAL '6 months'
                        AND COALESCE(legacy_values->>'Status', '${DEMANDE_STATUS.EMPTY}') = '${DEMANDE_STATUS.EMPTY}'
                        AND COALESCE((legacy_values->>'Prise de contact')::boolean, false) = false
                    )
                  )
                )
              `)
              .as('stats')
          )
          .where(sql`${sql.ref('legacy_values')}->'Gestionnaires'`, '@>', sql`jsonb_build_array(${sql.ref('t.name')})`)
          .as('demands_stats'),
      (join) => join.onTrue()
    )
    .select((eb) => [
      'id',
      'name',
      'type',

      // Users
      sql<FrontendType<Selectable<Pick<Users, 'id' | 'email' | 'last_connection'>>>[]>`
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', u.id,
                'email', u.email,
                'last_connection', u.last_connection
              )
              ORDER BY u.last_connection DESC NULLS LAST
            )
            FROM users u
            WHERE ${sql.ref('t.name')} = ANY(u.gestionnaires)
              AND u.email IS NOT NULL
              AND u.active IS TRUE
          ),
          '[]'::json
        )
      `.as('users'),

      // Réseaux
      sql<Pick<ReseauxDeChaleur, 'id_fcu' | 'Identifiant reseau' | 'nom_reseau'>[]>`COALESCE(${eb.ref('r.json')}, '[]'::json)`.as(
        'reseauxDeChaleur'
      ),
      sql<Pick<ZonesEtReseauxEnConstruction, 'id_fcu' | 'nom_reseau' | 'is_zone'>[]>`
        COALESCE(${eb.ref('rc.json')}, '[]'::json)
      `.as('reseauxEnConstruction'),

      // Stats des demandes
      sql<Stats>`
        COALESCE(
          ${eb.ref('demands_stats.stats')}->'total',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('allTime'),
      sql<Stats>`
        COALESCE(
          ${eb.ref('demands_stats.stats')}->'lastThreeMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastThreeMonths'),
      sql<Stats>`
        COALESCE(
          ${eb.ref('demands_stats.stats')}->'lastSixMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastSixMonths'),

      // Dernière relance
      sql<string | null>`${eb.ref('tr.created_at')}`.as('reminder_date'),
    ])
    .orderBy('t.name')
    .execute();

  return tagsStats;
};

export type TagsStats = Awaited<ReturnType<typeof getTagsStats>>[number];
