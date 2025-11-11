import type { Insertable } from 'kysely';
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
      legacy_values: sql<string>`${JSON.stringify(values)}::jsonb`,
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

export const updateSatisfaction = async (demandId: string, satisfaction: boolean) => {
  const demand = await update(demandId, { 'Recontacté par le gestionnaire': satisfaction ? 'Oui' : 'Non' });

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
