import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import Checkboxes, { type CheckboxesProps } from '@/components/form/dsfr/Checkboxes';
import Input from '@/components/form/dsfr/Input';
import RangeFilter, { type RangeFilterProps } from '@/components/form/dsfr/RangeFilter';
import type { Interval } from '@/utils/interval';
import type { TableCellProps } from './TableCell';

export type TableFilterType = 'Range' | 'Facets';

export type TableFilterProps = {
  onChange: (value: any) => void;
  facetedMinMaxValues?: [number, number];
  facetedUniqueValues?: Map<any, number>;
  cellType?: TableCellProps<any>['type'];
} & (
  | {
      type: 'Range';
      filterProps: Partial<Pick<RangeFilterProps, 'domain'>> & Omit<RangeFilterProps, 'value' | 'onChange' | 'domain'>;
      value?: [number, number] | [string, string, boolean?];
    }
  | {
      type: 'Facets';
      filterProps?: Omit<CheckboxesProps, 'options'> & { Component: React.FC<{ value: string }> };
      value?: Record<string, boolean>;
    }
);

export const defaultTableFilterFns = {
  Facets: 'includesAny',
  Range: 'inNumberRangeNotNull', // Sera remplacé par inDateRangeNotNull si cellType est DateTime/Date
} as const;

const TableFilter = ({ value, type, onChange, filterProps, facetedUniqueValues, facetedMinMaxValues, cellType }: TableFilterProps) => {
  const isDateRange = type === 'Range' && (cellType === 'DateTime' || cellType === 'Date');

  React.useEffect(() => {
    if (!value) {
      return;
    }
    // reset filters when they are back to defaults
    if (isDateRange) {
      const minDate = facetedMinMaxValues?.[0] as unknown as string;
      const maxDate = facetedMinMaxValues?.[1] as unknown as string;
      const dateValue = value as [string, string, boolean?];
      if (minDate && maxDate && dateValue[0] === minDate && dateValue[1] === maxDate && !dateValue[2]) {
        onChange(undefined);
      }
    } else if (type === 'Range') {
      const domain = filterProps?.domain || (facetedMinMaxValues as Interval);
      if (domain && value[0] === domain[0] && value[1] === domain[1]) onChange(undefined);
    } else if (type === 'Facets' && Object.values(value).every((v) => v === true)) {
      onChange(undefined);
    }
  }, [type, value, filterProps, onChange, isDateRange, facetedMinMaxValues]);

  if (isDateRange) {
    const minDate = (facetedMinMaxValues?.[0] as unknown as string) || '';
    const maxDate = (facetedMinMaxValues?.[1] as unknown as string) || '';
    const startDate = (value?.[0] as unknown as string) || minDate;
    const endDate = (value?.[1] as unknown as string) || maxDate;
    const includeNull = value?.[2] ?? false;

    const handleDateChange = (newStartDate: string, newEndDate: string, includeNulls: boolean) => {
      if (newStartDate === minDate && newEndDate === maxDate && !includeNulls) {
        onChange(undefined);
      } else {
        onChange([newStartDate, newEndDate, includeNulls] as any);
      }
    };

    return (
      <div className="space-y-4">
        <Input
          label="Date de début"
          nativeInputProps={{
            max: maxDate,
            min: minDate,
            onChange: (e) => {
              const newStart = e.target.value;
              handleDateChange(newStart, endDate, includeNull);
            },
            type: 'date',
            value: startDate,
          }}
        />
        <Input
          label="Date de fin"
          nativeInputProps={{
            max: maxDate,
            min: minDate,
            onChange: (e) => {
              const newEnd = e.target.value;
              handleDateChange(startDate, newEnd, includeNull);
            },
            type: 'date',
            value: endDate,
          }}
        />
        <div className="fr-checkbox-group fr-checkbox-group--sm">
          <input
            type="checkbox"
            id="include-null-dates"
            checked={includeNull}
            onChange={(e) => {
              const newIncludeNull = e.target.checked;
              handleDateChange(startDate, endDate, newIncludeNull);
            }}
          />
          <label className="fr-label" htmlFor="include-null-dates">
            Inclure les valeurs nulles
          </label>
        </div>
      </div>
    );
  }

  if (type === 'Range') {
    const { domain, ...rangeFilterProps } = filterProps || {};
    const selectedDomain = domain || (facetedMinMaxValues as Interval);
    return selectedDomain ? (
      <RangeFilter small value={value as [number, number]} onChange={onChange} domain={selectedDomain} {...rangeFilterProps} />
    ) : (
      'Aucun filtrage possible'
    );
  } else if (type === 'Facets') {
    const entries = Object.entries(facetedUniqueValues ? Object.fromEntries(facetedUniqueValues) : {}).sort(([k1], [k2]) =>
      k1.localeCompare(k2)
    );
    const { Component, ...facetsFilterProps } = filterProps || {};

    return (
      <Checkboxes
        small
        className="mb-0!"
        options={entries.map(([facetKey, nbOccurences]) => ({
          label: (
            <span className="flex items-center gap-1">
              {facetKey === 'true' || facetKey === 'false' ? (
                <Badge noIcon severity={facetKey === 'true' ? 'success' : 'error'} small>
                  {facetKey === 'true' ? 'Oui' : 'Non'}
                </Badge>
              ) : Component ? (
                <Component value={facetKey} />
              ) : facetKey === 'undefined' ? (
                'Aucun'
              ) : (
                facetKey
              )}{' '}
              ({nbOccurences as number})
            </span>
          ),
          nativeInputProps: {
            checked: !value ? true : value[facetKey] === true,
            onChange: () => {
              const newValue = {
                ...(value || entries.reduce((acc, [facetKey]) => ({ ...acc, [facetKey]: true }), {} as Record<string, boolean>)),
              };
              newValue[facetKey] = !newValue[facetKey];
              onChange(newValue);
            },
          },
        }))}
        {...facetsFilterProps}
      />
    );
  }

  return 'TODO';
};

export default TableFilter;
