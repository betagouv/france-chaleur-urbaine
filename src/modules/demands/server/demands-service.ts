import type { Insertable } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { clientConfig } from '@/client-config';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { sendEmailTemplate } from '@/modules/email';
import { type DemandEmails, kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';
import { parentLogger } from '@/server/helpers/logger';

const logger = parentLogger.child({
  module: 'demands',
});

export const tableName = 'demands';
export const emailsTableName = 'demand_emails';
const baseModel = createBaseModel(tableName);

export const update = async (recordId: string, values: Partial<AirtableLegacyRecord>) => {
  // Get current demand before update to detect changes
  const currentDemand = await kdb.selectFrom(tableName).selectAll().where('id', '=', recordId).executeTakeFirst();

  const [updatedDemand] = await kdb
    .updateTable(tableName)
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify(values)}::jsonb`, // The || operator merges the two JSONB objects, with the new values overwriting any matching keys.
      updated_at: new Date(),
    })
    .where('id', '=', recordId)
    .returningAll()
    .execute();

  // Check if 'Gestionnaire Affecté à' has changed
  const oldAssignment = currentDemand?.legacy_values['Gestionnaire Affecté à'];
  const newAssignment = values['Gestionnaire Affecté à'];

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

  return { id: updatedDemand.id, ...updatedDemand.legacy_values };
};

export const create = async (values: Partial<AirtableLegacyRecord>) => {
  const [createdDemand] = await kdb
    .insertInto(tableName)
    .values({
      created_at: new Date(),
      legacy_values: sql<string>`${JSON.stringify({
        ...values,
        'Date de la demande': new Date().toISOString(),
      })}::jsonb`,
      updated_at: new Date(),
    })
    .returningAll()
    .execute();

  return { id: createdDemand.id, ...createdDemand.legacy_values };
};

export const remove = baseModel.remove;

export const listEmails = async (demandId: string) => {
  const emails = await kdb.selectFrom('demand_emails').selectAll().where('demand_id', '=', demandId).execute();
  return emails;
};

export const createEmail = async (values: Omit<Insertable<DemandEmails>, 'created_at' | 'updated_at' | 'id'>) => {
  const [createdEmail] = await kdb
    .insertInto('demand_emails')
    .values({ ...values, created_at: new Date(), updated_at: new Date() })
    .returningAll()
    .execute();
  return createdEmail;
};

export const updateFromRelanceId = async (relanceId: string, values: Partial<AirtableLegacyRecord>) => {
  const relanceDemand = await kdb
    .selectFrom(tableName)
    .selectAll()
    .where(sql`legacy_values->>'Relance ID'`, '=', relanceId)
    .executeTakeFirst();

  if (!relanceDemand) {
    throw new Error(`Relance demand not found for relance ID: ${relanceId}`);
  }

  return update(relanceDemand.id, values);
};

export const updateCommentFromRelanceId = async (relanceId: string, comment: string) => {
  return updateFromRelanceId(relanceId, { 'Commentaire relance': comment });
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
