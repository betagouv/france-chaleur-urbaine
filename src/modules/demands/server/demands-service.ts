import { faker } from '@faker-js/faker';
import type { Insertable, Selectable } from 'kysely';
import type { User } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { clientConfig } from '@/client-config';
import { type CreateDemandInput, demandStatusDefault, formatDataToLegacyAirtable } from '@/modules/demands/constants';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
import { createEvent, createUserEvent } from '@/modules/events/server/service';
import { createEligibilityTestAddress } from '@/modules/pro-eligibility-tests/server/service';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { type DemandEmails, type Demands, kdb, type ProEligibilityTestsAddresses, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';
import * as assignmentRulesService from './assignment_rules-service';

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
  augmentedDemand.Commentaire ??= '';
  augmentedDemand.Commentaires_internes_FCU ??= '';
  augmentedDemand['Relance à activer'] ??= false;

  return augmentedDemand;
};

const augmentGestionnaireDemand = <T extends Selectable<Demands>>({
  demand: { legacy_values, ...demand },
  testAddress,
}: {
  demand: T;
  testAddress: Selectable<ProEligibilityTestsAddresses> | null;
}) => {
  const history = testAddress?.eligibility_history as ProEligibilityTestHistoryEntry[] | undefined;
  const lastEligibility = history?.[history.length - 1];
  legacy_values['en PDP'] = lastEligibility?.eligibility?.type.includes('dans_pdp') ? 'Oui' : 'Non';
  legacy_values['Prise de contact'] ??= false;
  legacy_values.Status ??= demandStatusDefault;

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
    },
  };
};

export const update = async (recordId: string, values: Partial<AirtableLegacyRecord>, userId?: string) => {
  // Get current demand before update to detect changes
  const currentDemand = await kdb.selectFrom(tableName).selectAll().where('id', '=', recordId).executeTakeFirst();

  // Check if 'Gestionnaire Affecté à' has changed
  const oldAssignment = currentDemand?.legacy_values['Gestionnaire Affecté à'];
  const newAssignment = values['Gestionnaire Affecté à'];

  if (
    values['Affecté à'] &&
    currentDemand?.legacy_values['Gestionnaire Affecté à'] &&
    values['Affecté à'] !== currentDemand?.legacy_values['Gestionnaire Affecté à']
  ) {
    // Affectation a changé, on reset le gestionnaire affecté à
    values['Gestionnaire Affecté à'] = values['Affecté à'];
  }
  if (newAssignment && oldAssignment !== newAssignment) {
    // Affectation a changé, on demande une revalidation des gestionnaires
    values['Gestionnaires validés'] = false;
  }

  const [updatedDemand] = await kdb
    .updateTable(tableName)
    .set({
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
  return augmentAdminDemand({ demand: updatedDemand, testAddress: testAddress || null });
};

export const create = async (values: CreateDemandInput) => {
  const legacyValues = formatDataToLegacyAirtable(values);

  const [conso, nbLogement] = await Promise.all([
    getConsommationGazAdresse(legacyValues.Latitude, legacyValues.Longitude),
    legacyValues.Logement
      ? { batiment_groupe_id: undefined, nb_logements: legacyValues.Logement }
      : getNbLogement(legacyValues.Latitude, legacyValues.Longitude),
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
        Logement: nbLogement?.nb_logements ? nbLogement.nb_logements : undefined,
      })}::jsonb`,
      updated_at: new Date(),
    })
    .returningAll()
    .execute();

  let testAddress: Awaited<ReturnType<typeof createEligibilityTestAddress>> | null = null;
  if (legacyValues.Latitude && legacyValues.Longitude) {
    testAddress = await createEligibilityTestAddress({
      address: legacyValues.Adresse,
      demand_id: createdDemand.id,
      latitude: legacyValues.Latitude,
      longitude: legacyValues.Longitude,
    });
  }

  await Promise.all([
    createEvent({
      context_id: createdDemand.id,
      context_type: 'demand',
      data: values,
      type: 'demand_created',
    }),
    sendEmailTemplate(
      'demands.user-new',
      { email: legacyValues.Mail },
      {
        demand: {
          ...legacyValues,
          'Distance au réseau': legacyValues['Distance au réseau'] ?? 9999,
          Structure: legacyValues.Structure as any,
          'Type de chauffage': legacyValues['Type de chauffage'] as 'Collectif' | 'Autre / Je ne sais pas' | 'Individuel',
        },
      } // si > 1000m la distance est null, or le template veut une distance
    ),
    // Automation import from https://airtable.com/app9opX8gRAtBqkan/wflvqEW0CLeXZ2pO0
    sendEmailTemplate('demands.admin-new', { email: clientConfig.destinationEmails.contact }, { demand: legacyValues as any }),
  ]);

  return augmentAdminDemand({ demand: createdDemand, testAddress });
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

export const listEmails = async (demandId: string) => {
  const emails = await kdb.selectFrom('demand_emails').selectAll().where('demand_id', '=', demandId).execute();
  return emails;
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

export const updateFromRelanceId = async (relanceId: string, values: Partial<AirtableLegacyRecord>, userId?: string) => {
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

export const listAdmin = async () => {
  let startTime = Date.now();

  const records = await kdb
    .selectFrom('demands')
    .innerJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests_addresses.demand_id', 'demands.id')
    .selectAll('demands')
    .select(sql.raw(`to_jsonb(pro_eligibility_tests_addresses)`).as('testAddress'))
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  const { count } = await kdb.selectFrom('demands').select(kdb.fn.count<number>('id').as('count')).executeTakeFirstOrThrow();

  logger.info('kdb.getAdminDemands', {
    duration: Date.now() - startTime,
    recordsCount: records.length,
  });

  // Récupére et parse les règles et leurs résultats
  const { items: assignmentRules } = await assignmentRulesService.list();
  const parsedRules = await assignmentRulesService.parseAssignmentRules(assignmentRules);

  const reseauxDeChaleur = await kdb.selectFrom('reseaux_de_chaleur').select(['tags', 'id_fcu']).execute();

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
          testAddress: testAddress as Selectable<ProEligibilityTestsAddresses> & { eligibility_history: ProEligibilityTestHistoryEntry[] },
        });

        const tags = reseauxDeChaleur.find((reseau) => reseau.id_fcu === augmentedDemand.testAddress.eligibility?.id_fcu)?.tags ?? [];
        const rulesResult = assignmentRulesService.applyParsedRulesToEligibilityData(parsedRules, { tags });

        return {
          ...augmentedDemand,
          recommendedAssignment: rulesResult.assignment ?? 'Non affecté',
          recommendedTags: [...new Set([...tags, ...rulesResult.tags])],
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
  const records = await kdb
    .selectFrom('demands')
    .innerJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests_addresses.demand_id', 'demands.id')
    .selectAll('demands')
    .select(sql.raw(`to_jsonb(pro_eligibility_tests_addresses)`).as('testAddress'))
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
  const demands = records.map(({ testAddress, ...demand }) =>
    augmentGestionnaireDemand({
      demand,
      testAddress: testAddress as Selectable<ProEligibilityTestsAddresses> & { eligibility_history: ProEligibilityTestHistoryEntry[] },
    })
  );

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
