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

export const createField = async (baseId: string, tableId: string, field: AirtableField) => {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`, {
    body: JSON.stringify(field),
    headers: {
      Authorization: `Bearer ${serverConfig.AIRTABLE_KEY_API}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (res.status !== 200) {
    if (res.headers.get('content-type')?.includes('application/json')) {
      console.error(await res.json());
    } else {
      console.error(await res.text());
    }
    throw new Error(`Failed to create field "${field.name}": status ${res.status}`);
  }
};

export const createTable = async (baseId: string, name: string, fields: AirtableField[]) => {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    body: JSON.stringify({
      fields,
      name,
    }),
    headers: {
      Authorization: `Bearer ${serverConfig.AIRTABLE_KEY_API}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (res.status !== 200) {
    if (res.headers.get('content-type') === 'application/json') {
      console.error(await res.json());
    } else {
      console.error(await res.text());
    }
    throw new Error(`invalid status ${res.status}`);
  }
};

type AttachementContent = {
  contentType: string;
  file: string;
  filename: string;
};
/**
 * Allows uploading attachments to airtable directly instead of using an external url.
 * Supports files up to 5MB.
 * See https://airtable.com/developers/web/api/upload-attachment
 */
export const uploadAttachment = async (recordId: string, attachementsFieldName: string, content: AttachementContent) => {
  const res = await fetch(
    `https://content.airtable.com/v0/${serverConfig.AIRTABLE_BASE}/${recordId}/${attachementsFieldName}/uploadAttachment`,
    {
      body: JSON.stringify(content),
      headers: {
        Authorization: `Bearer ${serverConfig.AIRTABLE_KEY_API}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }
  );
  if (!res.ok) {
    if (res.headers.get('content-type') === 'application/json') {
      console.error(await res.json());
    } else {
      console.error(await res.text());
    }
    throw new Error(`invalid status ${res.status}`);
  }
  return;
};
