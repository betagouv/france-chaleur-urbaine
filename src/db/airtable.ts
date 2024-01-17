import Airtable, { FieldSet, Table } from 'airtable';
import dotenv from 'dotenv';
import { Airtable as AirtableTableEnum } from 'src/types/enum/Airtable';

export type { FieldSet } from 'airtable';
export type { QueryParams } from 'airtable/lib/query_params';

dotenv.config({ path: '.env.local' });
dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY_API }).base(
  process.env.AIRTABLE_BASE || ''
);

export default base;

type AirtableTable = `${AirtableTableEnum}`;

export const AirtableDB = (table: AirtableTable): Table<FieldSet> => {
  return base(table);
};

export const listTables = async (baseId: string): Promise<any[]> => {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_KEY_API}`,
      },
    }
  );
  if (res.status !== 200) {
    throw new Error(`invalid response status ${res.status}`);
  }
  const { tables } = await res.json();
  return tables
    .filter((table: any) => table.name.startsWith('FCU - '))
    .map((table: any) => ({
      id: table.id,
      name: table.name,
      fields: table.fields.map((field: any) => ({
        id: field.id,
        type: field.type,
        name: field.name,
      })),
    }));
};

type AirtableField = {
  name: string;
  type:
    | 'singleLineText'
    | 'email'
    | 'url'
    | 'multilineText'
    | 'number'
    | 'percent'
    | 'currency'
    | 'singleSelect'
    | 'multipleSelects'
    | 'singleCollaborator'
    | 'multipleCollaborators'
    | 'multipleRecordLinks'
    | 'date'
    | 'dateTime'
    | 'phoneNumber'
    | 'multipleAttachments'
    | 'checkbox'
    | 'formula'
    | 'createdTime'
    | 'rollup'
    | 'count'
    | 'lookup'
    | 'multipleLookupValues'
    | 'autoNumber'
    | 'barcode'
    | 'rating'
    | 'richText'
    | 'duration'
    | 'lastModifiedTime'
    | 'button'
    | 'createdBy'
    | 'lastModifiedBy'
    | 'externalSyncSource'
    | 'aiText';
  options?: any;
};

export const createTable = async (
  baseId: string,
  name: string,
  fields: AirtableField[]
) => {
  console.log('base', baseId, process.env.AIRTABLE_KEY_API);
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_KEY_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        fields,
      }),
    }
  );
  if (res.status !== 200) {
    if (res.headers.get('content-type') === 'application/json') {
      console.error(await res.json());
    } else {
      console.error(await res.text());
    }
    throw new Error(`invalid status ${res.status}`);
  }
};
