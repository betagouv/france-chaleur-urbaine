import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import Checkboxes, { type CheckboxesProps } from '@/components/form/dsfr/Checkboxes';
import Input from '@/components/form/dsfr/Input';
import RangeFilter, { type RangeFilterProps } from '@/components/form/dsfr/RangeFilter';
import ComboBox, { type ComboBoxOption } from '@/components/ui/ComboBox';
import type { Interval } from '@/utils/interval';
import type { TableCellProps } from './TableCell';

export type TableFilterType = 'Range' | 'Facets' | 'ComboBox' | 'EmptyOrFilled';

export type TableFilterProps = {
  onChange: (value: any) => void;
  facetedMinMaxValues?: [number, number];
  facetedUniqueValues?: Map<any, number>;
  cellType?: TableCellProps<any>['type'];
} & (
  | {
      type: 'Range';
      filterProps: Partial<Pick<RangeFilterProps, 'domain'>> & Omit<RangeFilterProps, 'value' | 'onChange' | 'domain'>;
      value?: [number, number] | [string | null, string | null, boolean?];
    }
  | {
      type: 'Facets';
      filterProps?: Omit<CheckboxesProps, 'options'> & { Component: React.FC<{ value: string }> };
      value?: Record<string, boolean>;
    }
  | {
      type: 'ComboBox';
      filterProps: { options: ComboBoxOption[]; label?: string; placeholder?: string };
      value?: string[];
    }
  | {
      type: 'EmptyOrFilled';
      filterProps?: { filledLabel?: string; emptyLabel?: string };
      value?: 'filled' | 'empty' | undefined;
    }
);

export const defaultTableFilterFns = {
  ComboBox: 'arrayIncludesAny',
  EmptyOrFilled: 'emptyOrFilled',
  Facets: 'includesAny',
  Range: 'inNumberRangeNotNull', // Sera remplacé par inDateRangeNotNull si cellType est DateTime/Date
} as const;

// Default date range values for date filters
export const DEFAULT_MIN_DATE = '1900-01-01';
export const DEFAULT_MAX_DATE = '2100-12-31';

const TableFilter = ({ value, type, onChange, filterProps, facetedUniqueValues, facetedMinMaxValues, cellType }: TableFilterProps) => {
  const isDateRange = type === 'Range' && (cellType === 'DateTime' || cellType === 'Date');

  React.useEffect(() => {
    if (!value) {
      return;
    }
    // reset filters when they are back to defaults
    if (isDateRange) {
      const dateValue = value as [string | null, string | null, boolean?];
      // Reset if both dates are null and includeNull is false
      if (!dateValue[0] && !dateValue[1] && !dateValue[2]) {
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
    const dateValue = value as [string | null, string | null, boolean?] | undefined;
    // Use default dates for display, but store only user input
    const startDate = dateValue?.[0] || '';
    const endDate = dateValue?.[1] || '';
    const includeNull = dateValue?.[2] ?? false;

    const handleDateChange = (newStartDate: string, newEndDate: string, includeNulls: boolean) => {
      // Only store what user has entered (empty string becomes null)
      const storedStart = newStartDate || null;
      const storedEnd = newEndDate || null;

      // If both dates are null and includeNull is false, clear the filter
      if (!storedStart && !storedEnd && !includeNulls) {
        onChange(undefined);
      } else {
        onChange([storedStart, storedEnd, includeNulls] as any);
      }
    };

    return (
      <div className="space-y-4">
        <Input
          label="Date de début"
          nativeInputProps={{
            max: DEFAULT_MAX_DATE,
            min: DEFAULT_MIN_DATE,
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
            max: DEFAULT_MAX_DATE,
            min: DEFAULT_MIN_DATE,
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
  } else if (type === 'ComboBox') {
    const { options, label, placeholder } = filterProps || { options: [] };
    return (
      <ComboBox
        multiple
        options={options}
        value={value || []}
        onChange={(newValue) => {
          if (newValue.length === 0) {
            onChange(undefined);
          } else {
            onChange(newValue);
          }
        }}
        label={label}
        placeholder={placeholder}
      />
    );
  } else if (type === 'EmptyOrFilled') {
    const { filledLabel = 'Rempli', emptyLabel = 'Vide' } = filterProps || {};
    return (
      <div className="flex flex-col gap-2">
        <div className="fr-checkbox-group fr-checkbox-group--sm">
          <input
            type="checkbox"
            id="filter-filled"
            checked={value === 'filled'}
            onChange={(e) => {
              if (e.target.checked) {
                onChange('filled');
              } else if (value === 'filled') {
                onChange(undefined);
              }
            }}
          />
          <label className="fr-label" htmlFor="filter-filled">
            {filledLabel}
          </label>
        </div>
        <div className="fr-checkbox-group fr-checkbox-group--sm">
          <input
            type="checkbox"
            id="filter-empty"
            checked={value === 'empty'}
            onChange={(e) => {
              if (e.target.checked) {
                onChange('empty');
              } else if (value === 'empty') {
                onChange(undefined);
              }
            }}
          />
          <label className="fr-label" htmlFor="filter-empty">
            {emptyLabel}
          </label>
        </div>
      </div>
    );
  }

  return 'TODO';
};

export default TableFilter;
