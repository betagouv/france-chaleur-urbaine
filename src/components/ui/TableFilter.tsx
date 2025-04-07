import { Badge } from '@codegouvfr/react-dsfr/Badge';
import React from 'react';

import Checkboxes, { type CheckboxesProps } from '@/components/form/dsfr/Checkboxes';
import RangeFilter, { type RangeFilterProps } from '@/components/form/dsfr/RangeFilter';
import { type Interval } from '@/utils/interval';

export type TableFilterType = 'Range' | 'Facets';

export type TableFilterProps = {
  onChange: (value: any) => void;
  facetedMinMaxValues?: [number, number];
  facetedUniqueValues?: Map<any, number>;
} & (
  | {
      type: 'Range';
      filterProps: Partial<Pick<RangeFilterProps, 'domain'>> & Omit<RangeFilterProps, 'value' | 'onChange' | 'domain'>;
      value?: [number, number];
    }
  | {
      type: 'Facets';
      filterProps?: Omit<CheckboxesProps, 'options'> & { Component: React.FC<{ value: string }> };
      value?: Record<string, boolean>;
    }
);

export const defaultTableFilterFns = {
  Range: 'inNumberRangeNotNull',
  Facets: 'includesAny',
} as const;

const Filter = ({ value, type, onChange, filterProps, facetedUniqueValues, facetedMinMaxValues }: TableFilterProps) => {
  React.useEffect(() => {
    if (!value) {
      return;
    }
    // reset filters when they are back to defaults
    if (type === 'Range') {
      const domain = filterProps.domain || (facetedMinMaxValues as Interval);
      if (domain && value[0] === domain[0] && value[1] === domain[1]) onChange(undefined);
    } else if (type === 'Facets' && Object.values(value).every((v) => v === true)) {
      onChange(undefined);
    }
  }, [type, value, filterProps, onChange]);

  if (type === 'Range') {
    const { domain, ...rangeFilterProps } = filterProps || {};

    return (
      <RangeFilter small value={value} onChange={onChange} domain={domain || (facetedMinMaxValues as Interval)} {...rangeFilterProps} />
    );
  } else if (type === 'Facets') {
    const entries = facetedUniqueValues ? Object.fromEntries(facetedUniqueValues) : {};
    const { Component, ...facetsFilterProps } = filterProps || {};

    return (
      <Checkboxes
        small
        className="!mb-0"
        options={Object.entries(entries).map(([facetKey, nbOccurences]) => ({
          label: (
            <span className="flex items-center gap-1">
              {facetKey === 'true' || facetKey === 'false' ? (
                <Badge noIcon severity={facetKey === 'true' ? 'success' : 'error'} small>
                  {facetKey === 'true' ? 'Oui' : 'Non'}
                </Badge>
              ) : Component ? (
                <Component value={facetKey} />
              ) : (
                facetKey
              )}
              ({nbOccurences as number})
            </span>
          ),
          nativeInputProps: {
            checked: !value ? true : value[facetKey] === true,
            onChange: () => {
              const newValue = {
                ...(value ||
                  Object.entries(entries).reduce((acc, [facetKey]) => ({ ...acc, [facetKey]: true }), {} as Record<string, boolean>)),
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

  return <>TODO</>;
};

export default Filter;
