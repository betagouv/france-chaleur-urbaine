import Input from '@codegouvfr/react-dsfr/Input';
import dynamic from 'next/dynamic';
import { type ReactNode, useCallback } from 'react';

import { buildExportColumns, buildExportSheet, type ExportConfig } from '../export';
import { FiltersDialog } from '../filters/FiltersDialog';
import type { FilterDef } from '../filters/filter-types';
import type { DataTablePreset } from '../types';
import type { DataTableInstance } from '../useDataTable';
import { DataTablePresets } from './DataTablePresets';
import { SortDialog } from './SortDialog';

const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

export type DataTableToolbarProps<Row, Filters extends readonly FilterDef<Row>[]> = {
  table: DataTableInstance<Row, Filters>;
  search: boolean;
  filtersDialog: boolean;
  sortDialog: boolean;
  presets?: DataTablePreset<Row, Filters>[];
  exportConfig?: ExportConfig<Row>;
  actions?: ReactNode;
  loading?: boolean;
};

/**
 * Search input, presets, filters/sort dialogs, export and custom actions above the table.
 */
export function DataTableToolbar<Row, Filters extends readonly FilterDef<Row>[]>({
  table,
  search,
  filtersDialog,
  sortDialog,
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

  return (
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
      {(filtersDialog || sortDialog || exportConfig || actions) && (
        <div className="flex items-center gap-2 ml-auto">
          {filtersDialog && <FiltersDialog table={table} />}
          {sortDialog && <SortDialog table={table} />}
          {exportConfig && (
            <ButtonExport size="small" priority="secondary" iconId="ri-download-line" filename={exportConfig.fileName} sheets={buildSheets}>
              Télécharger les données
            </ButtonExport>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
