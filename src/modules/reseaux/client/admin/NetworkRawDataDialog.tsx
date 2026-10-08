import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import {
  type NetworkFieldName,
  networkFieldDefinitions,
  networkFieldSourceDefinitions,
  networkFieldSources,
} from '@/modules/reseaux/field-sources';
import trpc from '@/modules/trpc/client';

export type NetworkRawDataTarget = { id: number; label: string; table: 'reseaux_de_chaleur' | 'reseaux_de_froid' };

type NetworkRawDataDialogProps = {
  control: DialogControl<NetworkRawDataTarget>;
};

const tableClasses = {
  cell: 'border border-(--border-default-grey) px-3 py-1 align-top',
  header: 'border border-(--border-default-grey) bg-(--background-alt-grey) px-3 py-1 text-left',
};

const formatValue = (value: unknown): string =>
  value === null || value === undefined
    ? ''
    : typeof value === 'boolean'
      ? value
        ? 'oui'
        : 'non'
      : Array.isArray(value)
        ? value.join(', ')
        : value instanceof Date
          ? value.toISOString()
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);

/** Every column of a network, raw, grouped by source: replaces the Airtable grid to check a value. */
function NetworkRawDataDialog({ control }: NetworkRawDataDialogProps) {
  const target = control.data;
  const { data, isLoading } = trpc.reseaux.getNetworkRawData.useQuery(
    target ? { id: target.id, table: target.table } : { id: 0, table: 'reseaux_de_chaleur' },
    {
      enabled: !!target,
    }
  );
  const fields = (Object.keys(networkFieldDefinitions) as NetworkFieldName[]).filter((field) => data && field in data);

  return (
    <Dialog {...control.dialogProps} title={target ? `Données brutes : ${target.label}` : 'Données brutes'} size="xl">
      {isLoading && <p>Chargement…</p>}
      {data && (
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto text-sm">
          {networkFieldSources.map((source) => {
            const sourceFields = fields.filter((field) => networkFieldDefinitions[field].source === source);
            return sourceFields.length === 0 ? null : (
              <section key={source}>
                <h3 className="mb-1 text-base">{networkFieldSourceDefinitions[source].label}</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={`${tableClasses.header} w-2/5`}>Champ</th>
                      <th className={tableClasses.header}>Valeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceFields.map((field) => (
                      <tr key={field}>
                        <td className={tableClasses.cell}>
                          <div>{networkFieldDefinitions[field].label}</div>
                          {/* technical column name, for the SQL queries and the imports */}
                          <div className="text-xs text-gray-500">{field}</div>
                        </td>
                        <td className={`${tableClasses.cell} whitespace-pre-wrap break-all`}>{formatValue(data[field])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}

export default NetworkRawDataDialog;
