import { Fragment } from 'react';

import { VerticalDivider } from '@/components/ui/Divider';
import Indicator from '@/components/ui/Indicator';

import { areFilterValuesEqual } from '../filters/filter-predicates';
import type { FilterDef, FilterValues } from '../filters/filter-types';
import type { DataTablePreset } from '../types';
import type { DataTableInstance } from '../useDataTable';

type DataTablePresetsProps<Row, Filters extends readonly FilterDef<Row>[]> = {
  table: DataTableInstance<Row, Filters>;
  presets: DataTablePreset<Row, Filters>[];
  loading?: boolean;
};

/**
 * Quick filter presets shown as clickable indicators; the active one matches the current filter values exactly.
 */
export function DataTablePresets<Row, Filters extends readonly FilterDef<Row>[]>({
  table,
  presets,
  loading,
}: DataTablePresetsProps<Row, Filters>) {
  return (
    <div className="flex flex-wrap items-stretch">
      {presets.map((preset, index) => {
        const isActive = areFilterValuesEqual(table.filterValues as FilterValues, preset.filters as FilterValues);
        return (
          <Fragment key={preset.id}>
            <Indicator
              loading={loading}
              label={preset.label}
              value={preset.getCount?.(table.data) ?? 0}
              valueSuffix={preset.valueSuffix}
              active={isActive}
              onClick={() => table.setFilterValues(isActive ? {} : preset.filters)}
            />
            {index < presets.length - 1 && <VerticalDivider className="hidden md:block" />}
          </Fragment>
        );
      })}
    </div>
  );
}
