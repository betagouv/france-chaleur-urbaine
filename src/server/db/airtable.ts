import Airtable, { type FieldSet, type Table } from 'airtable';

import { serverConfig } from '@/server/config';
import type { Airtable as AirtableTableEnum } from '@/types/enum/Airtable';

export type { FieldSet } from 'airtable';
export type { QueryParams } from 'airtable/lib/query_params';

const base = new Airtable({ apiKey: serverConfig.AIRTABLE_KEY_API }).base(serverConfig.AIRTABLE_BASE);

export default base;

export type AirtableTable = `${AirtableTableEnum}`;

export const AirtableDB = (table: AirtableTable): Table<FieldSet> => {
  return base(table);
};

type AirtableTableDefinition = {
  fields: { id: string; name: string; type: string }[];
  id: string;
  name: string;
};

export const listTables = async (baseId: string) => {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: {
      Authorization: `Bearer ${serverConfig.AIRTABLE_KEY_API}`,
    },
  });
  if (res.status !== 200) {
    throw new Error(`invalid response status ${res.status}`);
  }
  const { tables } = (await res.json()) as { tables: AirtableTableDefinition[] };
  return tables
    .filter((table) => table.name.startsWith('FCU - '))
    .map((table) => ({
      fields: table.fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
      })),
      id: table.id,
      name: table.name,
    }));
};
