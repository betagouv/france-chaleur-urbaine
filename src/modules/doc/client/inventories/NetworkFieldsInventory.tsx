import {
  type NetworkFieldName,
  type NetworkFieldSource,
  networkFieldDefinitions,
  networkFieldSourceDefinitions,
  networkFieldSources,
} from '@/modules/reseaux/field-sources';

import { tableClasses } from './table-classes';

/**
 * Columns of the heat and cold network tables grouped by the source that owns their value,
 * generated from the field registry (src/modules/reseaux/field-sources.ts).
 */
export function NetworkFieldsInventory() {
  const fields = Object.keys(networkFieldDefinitions) as NetworkFieldName[];
  return (
    <div className="flex flex-col gap-6">
      {networkFieldSources.map((source) => (
        <SourceSection key={source} source={source} fields={fields.filter((field) => networkFieldDefinitions[field].source === source)} />
      ))}
    </div>
  );
}

type SourceSectionProps = { fields: NetworkFieldName[]; source: NetworkFieldSource };

function SourceSection({ fields, source }: SourceSectionProps) {
  if (fields.length === 0) {
    return null;
  }
  const definition = networkFieldSourceDefinitions[source];
  return (
    <section>
      <h4 className="mb-1">{definition.label}</h4>
      <p className="mb-2 text-sm">{definition.description}</p>
      <div className={tableClasses.wrapper}>
        <table className={tableClasses.table}>
          <thead>
            <tr>
              <th className={tableClasses.header}>Colonne</th>
              <th className={tableClasses.header}>Libellé</th>
              <th className={tableClasses.header}>Unité</th>
              <th className={tableClasses.header}>Tables</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const fieldDefinition = networkFieldDefinitions[field];
              return (
                <tr key={field}>
                  <td className={tableClasses.cell}>
                    <code className="text-xs">{field}</code>
                  </td>
                  <td className={tableClasses.cell}>{fieldDefinition.label}</td>
                  <td className={tableClasses.cell}>{'unit' in fieldDefinition ? fieldDefinition.unit : ''}</td>
                  <td className={tableClasses.cell}>
                    {'tables' in fieldDefinition ? 'Réseaux de chaleur' : 'Réseaux de chaleur et de froid'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
