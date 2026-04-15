import * as Sentry from '@sentry/nextjs';
import { TRPCError } from '@trpc/server';
import type { Insertable, Selectable } from 'kysely';
import type { User } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

import { clientConfig } from '@/client-config';
import {
  type BatchDemandContactInfo,
  type CreateBatchDemandInput,
  type CreateDemandInput,
  type CreateFCUTeamContactInput,
  demandStatusDefault,
  formatDataToLegacyAirtable,
  normalizeHeatingEnergy,
  normalizeHeatingType,
  type UpdateDemandInput,
  zAirtableFCUTeamContact,
} from '@/modules/demands/constants';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import { buildDemandAccessFilter, canUserAccessDemand, getUserPermissions } from '@/modules/permissions/server/service';
import type { Permission } from '@/modules/permissions/types';
import { createEligibilityTestAddress, updateEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import type { NetworkType } from '@/modules/reseaux/constants';
import { AirtableDB } from '@/server/db/airtable';
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
import { Airtable } from '@/types/enum/Airtable';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import type { FrontendType } from '@/utils/typescript';

const logger = parentLogger.child({
  module: 'demands',
});

export const tableName = 'demands';
export const emailsTableName = 'demand_emails';
const baseModel = createBaseModel(tableName);

export const createFCUTeamContact = async (values: CreateFCUTeamContactInput) => {
  await AirtableDB(Airtable.CONTACT_ENTRETIEN_UTILISATEUR).create(
    zAirtableFCUTeamContact.parse({
      Adresse: values.address,
      Date: new Date().toISOString(),
      Email: values.email,
      'Mode de chauffage': values.heatingEnergy,
      Nom: values.lastName,
      'Nom de la structure': values.company,
      'Nombre de logement': values.nbLogements,
      Prenom: values.firstName,
      Structure: values.structure,
      Surface: values.demandArea,
      'Type de structure': values.companyType,
      Téléphone: values.phone,
    })
  );
};

/**
 * Fills territory columns on a demand from its coordinates using PostGIS.
 */
const fillDemandTerritoryFromCoords = async (demandId: string, lon: number, lat: number) => {
  // Commune, département, région, EPCI in one query via ign_communes
  await sql`
    UPDATE demands d SET
      commune_code = c.insee_com,
      departement_code = c.insee_dep,
      region_code = c.insee_reg,
      epci_code = c.siren_epci
    FROM ign_communes c
    WHERE d.id = ${demandId}
      AND ST_Contains(c.geom, ST_Transform(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 2154))
  `.execute(kdb);

  // EPT via membres JSONB (Île-de-France only)
  await sql`
    UPDATE demands d SET ept_code = e.code
    FROM ept e
    WHERE d.id = ${demandId}
      AND d.commune_code IS NOT NULL
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(e.membres) m WHERE m->>'code' = d.commune_code)
  `.execute(kdb);
};

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

const getNetworkTypeFromEligibilityType = (type: EligibilityType): NetworkType | null => {
  switch (type) {
    case 'dans_pdp_reseau_existant':
    case 'reseau_existant_proche':
    case 'reseau_existant_tres_proche':
    case 'reseau_existant_loin':
    case 'dans_ville_reseau_existant_sans_trace':
      return 'existant';
    case 'dans_pdp_reseau_futur':
    case 'dans_zone_reseau_futur':
    case 'reseau_futur_tres_proche':
    case 'reseau_futur_loin':
    case 'reseau_futur_proche':
      return 'en_construction';
    default:
      return null;
  }
};

/**
 * Auto-assigns network_id and network_type on a demand based on its eligibility test address.
 * Also populates legacy fields for backward compatibility.
 */
const autoAssignNetworkFromEligibility = async (demandId: string) => {
  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select('eligibility_history')
    .where('demand_id', '=', demandId)
    .executeTakeFirst();

  if (!testAddress) return;

  const history = testAddress.eligibility_history as ProEligibilityTestHistoryEntry[] | null;
  const lastEligibility = history?.[history.length - 1]?.eligibility;

  if (!lastEligibility?.id_fcu || lastEligibility.type === 'trop_eloigne') return;

  const networkType = getNetworkTypeFromEligibilityType(lastEligibility.type);
  if (!networkType) return;

  await kdb
    .updateTable(tableName)
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify({
        'Distance au réseau': lastEligibility.distance,
        'Identifiant réseau': lastEligibility.id_sncu,
        'Nom réseau': lastEligibility.nom,
      })}::jsonb`,
      network_id: lastEligibility.id_fcu,
      network_type: networkType,
    })
    .where('id', '=', demandId)
    .execute();
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

  // If 'Affecté à' has changed, we consider 'Gestionnaire Affecté à' is outdated and reset it
  if (
    values['Affecté à'] &&
    currentDemand?.legacy_values['Gestionnaire Affecté à'] &&
    values['Affecté à'] !== currentDemand?.legacy_values['Affecté à']
  ) {
    values['Gestionnaire Affecté à'] = null;
  }

  // Sync real columns from legacy field changes
  const columnUpdates: Record<string, unknown> = {};

  if ('Gestionnaires validés' in values) {
    columnUpdates.validated = values['Gestionnaires validés'] === true;
  }

  if ('Identifiant réseau' in values) {
    const sncuId = values['Identifiant réseau'];
    if (sncuId) {
      const network = await kdb
        .selectFrom('reseaux_de_chaleur')
        .select('id_fcu')
        .where('"Identifiant reseau"' as any, '=', sncuId)
        .executeTakeFirst();
      if (network) {
        columnUpdates.network_id = network.id_fcu;
        columnUpdates.network_type = 'existant';
      }
    } else {
      columnUpdates.network_id = null;
      columnUpdates.network_type = null;
    }
  }

  const [updatedDemand] = await kdb
    .updateTable(tableName)
    .set({
      ...(comment_fcu && { comment_fcu }),
      ...(comment_gestionnaire && { comment_gestionnaire }),
      ...columnUpdates,
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

  const eventType = values['Gestionnaires validés'] ? 'demand_assigned' : 'demand_updated';

  if (userId) {
    await createUserEvent({
      author_id: userId,
      context_id: recordId,
      context_type: 'demand',
      data: values,
      type: eventType,
    });
  } else {
    await createEvent({
      context_id: recordId,
      context_type: 'demand',
      data: values,
      type: eventType,
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

  // Fill territory columns from coordinates
  if (lat && lon) {
    await fillDemandTerritoryFromCoords(createdDemand.id, lon, lat);
  }

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

  // Auto-assign network from eligibility
  await autoAssignNetworkFromEligibility(createdDemand.id);

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

type BatchDemandResolvedContact = BatchDemandContactInfo & {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  structure: string;
};

const getBatchDemandContactFromUser = async (userId: string): Promise<BatchDemandResolvedContact> => {
  const userContact = await kdb
    .selectFrom('users')
    .select(['email', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();

  return {
    company: userContact.structure_name || '',
    companyType: userContact.structure_type || '',
    demandArea: undefined,
    demandCompanyName: '',
    demandCompanyType: '',
    email: userContact.email,
    firstName: userContact.first_name || '',
    lastName: userContact.last_name || '',
    nbLogements: undefined,
    phone: userContact.phone || '',
    structure: userContact.structure_type || '',
  };
};

/**
 * Create multiple demands from test addresses
 * User info is fetched from the users table, unless an admin provides explicit contact data.
 * @param input - Batch demand creation input with addresses, optional contact data and heating type
 * @param currentUser - Current authenticated user creating the demands
 * @returns Array of objects with addressId and demandId for each created demand
 */
export const createBatch = async (
  input: CreateBatchDemandInput,
  currentUser: Pick<User, 'id' | 'role'>
): Promise<Array<{ addressId: string; demandId: string }>> => {
  const { addresses } = input;
  const demandOwnerUserId = currentUser.role === 'admin' && input.contact ? undefined : currentUser.id;
  const contact = currentUser.role === 'admin' && input.contact ? input.contact : await getBatchDemandContactFromUser(currentUser.id);

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
          company: contact.company,
          companyType: contact.companyType,
          coords,
          demandArea: contact.demandArea,
          demandCompanyName: contact.demandCompanyName,
          demandCompanyType: contact.demandCompanyType,
          department: eligibility.departement.nom as string,
          eligibility: {
            distance: eligibility.distance,
            inPDP: !!eligibility.pdp?.id_fcu,
            isEligible: eligibility.eligible,
          },
          email: contact.email,
          firstName: contact.firstName,
          heatingEnergy: addressData.heatingEnergy,
          heatingType: addressData.heatingType,
          lastName: contact.lastName,
          nbLogements: contact.nbLogements,
          phone: contact.phone,
          postcode: '',
          region: eligibility.region.nom as string,
          structure: contact.structure,
          termOfUse: true,
        },
        { pro_eligibility_tests_addresse_id: addressData.addressId, userId: demandOwnerUserId }
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

/**
 * Ensure the user has permissions to access the demand emails
 */
const ensureEmailsPermissions = async ({
  user,
  demandId,
  permissions: providedPermissions,
}: {
  demandId: string;
  permissions?: Permission[];
  user: User;
}) => {
  if (user.role === 'admin') {
    return;
  }

  const demand = await kdb
    .selectFrom('demands')
    .select([
      'user_id',
      'network_id',
      'network_type',
      'validated',
      'commune_code',
      'epci_code',
      'ept_code',
      'departement_code',
      'region_code',
    ])
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow();

  // Particulier/professionnel can only access their own demands
  if (user.role === 'particulier' || user.role === 'professionnel') {
    if (demand.user_id !== user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Unauthorized',
      });
    }
    return;
  }

  // Gestionnaire/collectivite/alec — check via permissions
  const permissions = providedPermissions ?? (await getUserPermissions(user.id));
  if (!canUserAccessDemand(user, permissions, demand)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Unauthorized',
    });
  }
};

export const listEmails = async ({ demandId, user, permissions }: { demandId: string; user: User; permissions?: Permission[] }) => {
  await ensureEmailsPermissions({ demandId, permissions, user });
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

  await createUserEvent({
    author_id: user.id,
    context_id: demand_id,
    context_type: 'demand',
    data: { key, object: emailContent.object, to: emailContent.to },
    type: 'demand_email_sent',
  });
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
    await createEvent({
      context_id: demand.id,
      context_type: 'demand',
      data: { isSecondRelance: !!relanced },
      type: 'demand_relance_sent',
    });
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
  const startTime = Date.now();

  const records = await buildDemandQuery()
    .select([
      sql<string | null>`
        CASE
          WHEN demands.network_type = 'existant' THEN (SELECT nom_reseau FROM reseaux_de_chaleur WHERE id_fcu = demands.network_id)
          WHEN demands.network_type = 'en_construction' THEN (SELECT nom_reseau FROM zones_et_reseaux_en_construction WHERE id_fcu = demands.network_id)
          ELSE NULL
        END
      `.as('network_name'),
      sql<string | null>`
        CASE WHEN demands.network_type = 'existant'
          THEN (SELECT "Identifiant reseau" FROM reseaux_de_chaleur WHERE id_fcu = demands.network_id)
          ELSE NULL
        END
      `.as('network_sncu_id'),
      sql<string[]>`
        CASE
          WHEN demands.network_type = 'existant' THEN (SELECT tags FROM reseaux_de_chaleur WHERE id_fcu = demands.network_id)
          WHEN demands.network_type = 'en_construction' THEN (SELECT tags FROM zones_et_reseaux_en_construction WHERE id_fcu = demands.network_id)
          ELSE NULL
        END
      `.as('network_tags'),
    ])
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  const { count } = await kdb.selectFrom('demands').select(kdb.fn.count<number>('id').as('count')).executeTakeFirstOrThrow();

  logger.info('kdb.getAdminDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });

  const demands = records
    .map((record) => {
      const { testAddress, ...demand } = record;
      const legacyValues = record.legacy_values;

      if (!legacyValues.Latitude || !legacyValues.Longitude || !legacyValues.Ville) {
        logger.warn('missing demand fields', {
          demandId: demand.id,
          missingFields: ['Latitude', 'Longitude', 'Ville'],
        });
        return null;
      }

      return augmentAdminDemand({ demand, testAddress });
    })
    .filter((v) => v !== null);

  return { count, items: demands };
};

type ListOptions = {
  anonymize?: boolean;
  permissions?: Permission[];
};

export const list = async (user: User, options?: ListOptions) => {
  if (!user) {
    return [];
  }

  const startTime = Date.now();
  const permissions = options?.permissions ?? (await getUserPermissions(user.id));

  if (permissions.length === 0 && user.role !== 'admin') {
    return [];
  }

  const accessFilter = buildDemandAccessFilter(user, permissions);

  const records = await accessFilter(buildDemandQuery()).orderBy(sql`legacy_values->>'Date de la demande'`, 'desc').execute();

  logger.info('kdb.getDemands', {
    duration: Date.now() - startTime,
    permissionsCount: permissions.length,
    recordsCount: records.length,
  });
  const demands = records.map(({ testAddress, ...demand }) => augmentGestionnaireDemand({ demand, testAddress }));

  if (options?.anonymize) {
    return demands.map((demand) => ({
      ...demand,
      Mail: anonymizeEmail(demand.Mail),
      Nom: anonymizeName(demand.Nom),
      Prénom: anonymizeName(demand.Prénom),
      Téléphone: demand.Téléphone ? anonymizePhone() : undefined,
    }));
  }

  return demands;
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

  const count = Number(result.numUpdatedRows ?? 0);

  if (count > 0) {
    await createUserEvent({
      author_id: userId,
      context_id: userId,
      context_type: 'user',
      data: { count, email },
      type: 'demand_linked_to_user',
    });
  }

  return count;
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
      'comment',

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

/**
 * Retourne les statistiques de demandes par réseau : utilisateurs avec permissions, stats de demandes, relances, notes.
 */
export const getReseauxStats = async () => {
  const reseauxStats = await kdb
    .selectFrom(
      kdb
        .selectFrom('reseaux_de_chaleur')
        .select(['id_fcu', 'nom_reseau', 'Identifiant reseau', 'tags', 'notes', sql<NetworkType>`'existant'`.as('network_type')])
        .unionAll(
          kdb
            .selectFrom('zones_et_reseaux_en_construction')
            .select([
              'id_fcu',
              'nom_reseau',
              sql<string | null>`NULL`.as('Identifiant reseau'),
              'tags',
              'notes',
              sql<NetworkType>`'en_construction'`.as('network_type'),
            ])
        )
        .as('r')
    )
    .leftJoinLateral(
      (eb) =>
        eb
          .selectFrom('demands')
          .select(
            sql
              .raw<{
                allTime: Stats;
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
          .whereRef('demands.network_id', '=', sql.ref('r.id_fcu'))
          .where('demands.network_type', '=', sql.ref<NetworkType>('r.network_type'))
          .where('demands.deleted_at', 'is', null)
          .as('demands_stats'),
      (join) => join.onTrue()
    )
    .select([
      'r.id_fcu',
      'r.nom_reseau',
      'r.Identifiant reseau',
      'r.network_type',
      'r.tags',
      'r.notes',

      // Users with permissions on this network
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
            JOIN user_permissions up ON up.user_id = u.id
            WHERE up.resource_id = ${sql.ref('r.id_fcu')}::text
              AND up.type = CASE WHEN ${sql.ref('r.network_type')} = 'existant' THEN 'reseau_existant' ELSE 'reseau_en_construction' END
              AND u.active IS TRUE
          ),
          '[]'::json
        )
      `.as('users'),

      // Reminders (all, ordered most recent first)
      sql<{ id: string; author_email: string | null; note: string | null; created_at: string }[]>`
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', nr.id,
                'author_email', u.email,
                'note', nr.note,
                'created_at', nr.created_at
              )
              ORDER BY nr.created_at DESC
            )
            FROM network_reminders nr
            LEFT JOIN users u ON u.id = nr.author_id
            WHERE nr.network_id = ${sql.ref('r.id_fcu')}
              AND nr.network_type = ${sql.ref('r.network_type')}
          ),
          '[]'::json
        )
      `.as('reminders'),

      // Stats
      sql<Stats>`
        COALESCE(
          ${sql.ref('demands_stats.stats')}->'total',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('allTime'),
      sql<Stats>`
        COALESCE(
          ${sql.ref('demands_stats.stats')}->'lastThreeMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastThreeMonths'),
      sql<Stats>`
        COALESCE(
          ${sql.ref('demands_stats.stats')}->'lastSixMonths',
          '{"total": 0, "pending": 0}'::jsonb
        )
      `.as('lastSixMonths'),
    ])
    .orderBy('r.nom_reseau', 'asc')
    .execute();

  return reseauxStats;
};

export type ReseauxStats = Awaited<ReturnType<typeof getReseauxStats>>[number];

/**
 * Recalcule l'éligibilité d'une demande en re-géocodant l'adresse via la BAN.
 * Délègue à updateEligibilityTestAddress qui met à jour l'adresse et les legacy_values de la demande.
 */
export const recalculateEligibility = async (demandId: string) => {
  const testAddress = await kdb
    .selectFrom('pro_eligibility_tests_addresses')
    .select(['id', 'source_address'])
    .where('demand_id', '=', demandId)
    .executeTakeFirstOrThrow();

  return updateEligibilityTestAddress(testAddress.id, testAddress.source_address);
};

/**
 * Admin: validates a demand (sets validated = true, computes relance, syncs to legacy_values).
 */
export const validateDemand = async (demandId: string, adminUserId: string) => {
  const demand = await kdb
    .selectFrom(tableName)
    .selectAll()
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirstOrThrow();

  const distance = demand.legacy_values['Distance au réseau'] ?? 999999;
  const isCollectif = demand.legacy_values['Type de chauffage'] === 'Collectif';
  const relanceAActiver = distance < 200 && isCollectif;

  await kdb
    .updateTable(tableName)
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify({
        'Gestionnaires validés': true,
        'Relance à activer': relanceAActiver,
      })}::jsonb`,
      updated_at: new Date(),
      validated: true,
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: { relance_a_activer: relanceAActiver, validated: true },
    type: 'demand_validated',
  });
};

/**
 * Admin: unvalidates a demand (sets validated = false, syncs to legacy_values).
 */
export const unvalidateDemand = async (demandId: string, adminUserId: string) => {
  await kdb
    .updateTable(tableName)
    .set({
      legacy_values: sql`legacy_values || '{"Gestionnaires validés": false}'::jsonb`,
      updated_at: new Date(),
      validated: false,
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: { validated: false },
    type: 'demand_unvalidated',
  });
};

/**
 * Admin: changes the network assigned to a demand.
 * Pass null for both to unassign the network.
 * Resets validated to false (admin must re-validate after network change).
 */
export const changeDemandNetwork = async (
  demandId: string,
  networkIdFcu: number | null,
  networkType: NetworkType | null,
  adminUserId: string
): Promise<void> => {
  let sncuId: string | null = null;
  let networkName: string | null = null;

  if (networkIdFcu && networkType === 'existant') {
    const network = await kdb
      .selectFrom('reseaux_de_chaleur')
      .select([sql<string>`"Identifiant reseau"`.as('sncu_id'), 'nom_reseau'])
      .where('id_fcu', '=', networkIdFcu)
      .executeTakeFirst();
    sncuId = network?.sncu_id ?? null;
    networkName = network?.nom_reseau ?? null;
  } else if (networkIdFcu && networkType === 'en_construction') {
    const network = await kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select('nom_reseau')
      .where('id_fcu', '=', networkIdFcu)
      .executeTakeFirst();
    networkName = network?.nom_reseau ?? null;
  }

  await kdb
    .updateTable(tableName)
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify({
        'Gestionnaires validés': false,
        'Identifiant réseau': sncuId,
        'Nom réseau': networkName,
      })}::jsonb`,
      network_id: networkIdFcu,
      network_type: networkType,
      updated_at: new Date(),
      validated: false,
    })
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .execute();

  await createUserEvent({
    author_id: adminUserId,
    context_id: demandId,
    context_type: 'demand',
    data: { network_id: networkIdFcu, network_name: networkName, network_type: networkType },
    type: 'demand_network_changed',
  });
};

/**
 * Collectivité/ALEC: requests a network change on a demand.
 * Creates an event for admin review. The demand stays visible to the current gestionnaire.
 */
export const requestNetworkChange = async (demandId: string, requestedSncuId: string, reason: string, userId: string) => {
  // Verify the demand exists
  const demand = await kdb
    .selectFrom(tableName)
    .select(['id', 'network_id'])
    .where('id', '=', demandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  if (!demand) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Demande introuvable' });
  }

  await createUserEvent({
    author_id: userId,
    context_id: demandId,
    context_type: 'demand',
    data: { current_network_id: demand.network_id, reason, requested_sncu_id: requestedSncuId },
    type: 'demand_network_change_requested',
  });

  // Send notification email to admin
  const requester = await kdb.selectFrom('users').select('email').where('id', '=', userId).executeTakeFirst();
  await sendEmailTemplate(
    'demands.admin-network-change-request',
    { email: clientConfig.destinationEmails.pro },
    { demandId, reason, requestedSncuId, requesterEmail: requester?.email ?? userId }
  ).catch((error: unknown) => {
    logger.error('Failed to send network change request email:', error);
  });
};

// ─── Anonymization helpers ──────────────────────────────────────────────────

const anonymizeEmail = (email: string | undefined): string => {
  if (!email) return 'anonyme@example.com';
  const hash = simpleHash(email);
  return `utilisateur${hash}@exemple.fr`;
};

const anonymizeName = (name: string | undefined): string => {
  if (!name) return '***';
  return `${name.charAt(0)}***`;
};

const anonymizePhone = (): string => {
  return '06 ** ** ** **';
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 10000;
};
