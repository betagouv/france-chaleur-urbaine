import type { AirtableLegacyRecord } from '@/modules/demands/types';
import { kdb, sql } from '@/server/db/kysely';
import { createBaseModel } from '@/server/db/kysely/base-model';

export const tableName = 'demands';
const baseModel = createBaseModel(tableName);

export const update = async (recordId: string, values: Partial<AirtableLegacyRecord>) => {
  const [updatedDemand] = await kdb
    .updateTable(tableName)
    .set({
      airtable_legacy_values: sql`airtable_legacy_values || ${JSON.stringify(values)}::jsonb`, // The || operator merges the two JSONB objects, with the new values overwriting any matching keys.
    })
    .where('id', '=', recordId)
    .returningAll()
    .execute();
  return { id: updatedDemand.id, ...updatedDemand.airtable_legacy_values };
};

export const create = async (values: Partial<AirtableLegacyRecord>) => {
  const [createdDemand] = await kdb
    .insertInto(tableName)
    .values({
      airtable_legacy_values: sql<string>`${JSON.stringify(values)}::jsonb`,
    })
    .returningAll()
    .execute();

  // returningAll returns an array. We'll return the created doc (first result).
  return { id: createdDemand.id, ...createdDemand.airtable_legacy_values };
};

export const remove = baseModel.remove;
