import Input from '@codegouvfr/react-dsfr/Input';
import dynamic from 'next/dynamic';
import { type ReactNode, useCallback } from 'react';

import { buildExportColumns, buildExportSheet, type ExportConfig } from '../export';
import { FiltersDialog } from '../filters/FiltersDialog';
import type { FilterDef } from '../filters/filter-types';
import type { DataTablePreset } from '../types';
import type { DataTableInstance } from '../useDataTable';
import { DataTableActiveState } from './DataTableActiveState';
import { DataTablePresets } from './DataTablePresets';

const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

export type DataTableToolbarProps<Row, Filters extends readonly FilterDef<Row>[]> = {
  table: DataTableInstance<Row, Filters>;
  search: boolean;
  filtersDialog: boolean;
  presets?: DataTablePreset<Row, Filters>[];
  exportConfig?: ExportConfig<Row>;
  actions?: ReactNode;
  loading?: boolean;
};

/**
 * Search input, presets, results count, « Filtres et tri » dialog, export and custom actions above the table,
 * then the active sort/filter chips.
 */
export function DataTableToolbar<Row, Filters extends readonly FilterDef<Row>[]>({
  table,
  search,
  filtersDialog,
  presets,
  exportConfig,
  actions,
  loading,
}: DataTableToolbarProps<Row, Filters>) {
  const buildSheets = useCallback(
    () =>
      exportConfig
        ? [buildExportSheet(buildExportColumns(table.columns, exportConfig.extraColumns), table.rows, exportConfig.sheetName)]
        : [],
    [exportConfig, table.columns, table.rows]
  );

  const isNarrowed = table.rows.length !== table.data.length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
        {search && (
          <Input
            label=""
            className="mb-0! min-w-64 flex-1"
            nativeInputProps={{
              'aria-label': 'Rechercher',
              onChange: (event) => table.setSearch(event.target.value),
              placeholder: table.searchOptions.placeholder ?? 'Rechercher…',
              type: 'search',
              value: table.search,
            }}
          />
        )}
        {presets && presets.length > 0 && <DataTablePresets table={table} presets={presets} loading={loading} />}
        <div className="flex items-center gap-2 ml-auto">
          {!loading && (
            <span className="text-sm text-(--text-mention-grey) whitespace-nowrap">
              {isNarrowed
                ? `${table.rows.length.toLocaleString('fr-FR')} / ${table.data.length.toLocaleString('fr-FR')}`
                : table.data.length.toLocaleString('fr-FR')}{' '}
              résultat{table.data.length > 1 ? 's' : ''}
            </span>
          )}
          {filtersDialog && <FiltersDialog table={table} />}
          {exportConfig && (
            <ButtonExport size="small" priority="secondary" iconId="ri-download-line" filename={exportConfig.fileName} sheets={buildSheets}>
              Télécharger les données
            </ButtonExport>
          )}
          {actions}
        </div>
      </div>
      <DataTableActiveState table={table} />
    </>
  );
}
