import { writeFile } from 'fs/promises';
import camelCase from 'camelcase';
import { KnownAirtableBase, knownAirtableBases } from './bases';
import { listTables } from 'src/db/airtable';

export async function fetchBaseSchema(base: KnownAirtableBase) {
  console.info("Fetching Airtable tables starting with 'FCU - '...");
  const tables = await listTables(knownAirtableBases[base]);

  const typescriptTypes: string[] = tables.map((table: any) => {
    console.info(`- ${table.name}`);
    return `export interface ${slugifyAirtableTableName(table.name)} {
${table.fields
  .map((field: any) => {
    const fieldName = /^[a-zA-ZÀ-Ÿ_]+$/i.test(field.name)
      ? field.name
      : field.name.includes("'")
      ? `"${field.name}"`
      : `'${field.name}'`;
    const fieldType = airtableTypeToTypeScriptType(field.type);
    return `  ${fieldName}: ${fieldType};`;
  })
  .join('\n')}
}
`;
  });

  await writeFile('src/types/airtable-types.d.ts', typescriptTypes.join('\n'));
  console.info(
    'Airtable types were written to => src/types/airtable-types.d.ts'
  );
}

function slugifyAirtableTableName(name: string): string {
  return camelCase(name.replaceAll('FCU - ', ''), {
    pascalCase: true,
    preserveConsecutiveUppercase: true,
  });
}

/**
 * Convert and airtable type to a TypeScript type
 */
function airtableTypeToTypeScriptType(airtableType: string): string {
  switch (airtableType) {
    case 'singleSelect':
    case 'singleLineText':
    case 'multilineText':
    case 'email':
    case 'url':
    case 'phoneNumber':
      return 'string';
    case 'checkbox':
      return 'boolean';
    case 'multipleSelects':
      return 'string[]';
    case 'createdTime':
    case 'dateTime':
    case 'date':
      return 'Date';
    case 'autoNumber':
    case 'number':
      return 'number';

    case 'multipleAttachments':
    case 'singleCollaborator':
    case 'multipleRecordLinks':
    case 'formula':
    case 'multipleLookupValues':
      return `any; // unknown type ${airtableType}`;
    default:
      return `string; // unknown type ${airtableType}`;
  }
}
