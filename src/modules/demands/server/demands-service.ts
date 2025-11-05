import type { Insertable } from 'kysely';
import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { type DemandEmails, kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';

export const tableName = 'demands';
export const emailsTableName = 'demand_emails';
const baseModel = createBaseModel(tableName);

export const update = async (recordId: string, values: Partial<AirtableLegacyRecord>) => {
  const [updatedDemand] = await kdb
    .updateTable(tableName)
    .set({
      legacy_values: sql`legacy_values || ${JSON.stringify(values)}::jsonb`, // The || operator merges the two JSONB objects, with the new values overwriting any matching keys.
      updated_at: new Date(),
    })
    .where('id', '=', recordId)
    .returningAll()
    .execute();
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
