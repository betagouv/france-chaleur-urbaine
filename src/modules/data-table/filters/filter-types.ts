import type { ReactNode } from 'react';

export type FacetValue = string | number | boolean | null | undefined;

/** Facet key used for empty values (`null`, `undefined`, `''`), displayed as « Aucun ». */
export const EMPTY_FACET_KEY = '__empty__';

export type FacetOption = {
  key: string;
  count: number;
};

export type DateRangeFilterValue = {
  from?: string;
  to?: string;
  includeEmpty?: boolean;
};

type FilterDefBase = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
};

export type FacetsFilterDef<Row> = FilterDefBase & {
  type: 'facets';
  /** A row may contribute several facet values (tags); the row matches when at least one is selected. */
  getValue: (row: Row) => FacetValue | FacetValue[];
  /** Renders an option key (label lookup, badge…). Defaults to the key, booleans to Oui/Non. */
  formatOption?: (key: string) => ReactNode;
  /** `combobox` suits long option lists; defaults to checkboxes below 12 options, combobox above. */
  display?: 'checkboxes' | 'combobox';
};

export type RangeFilterDef<Row> = FilterDefBase & {
  type: 'range';
  getValue: (row: Row) => number | null | undefined;
  /** Bounds of the slider; defaults to the min/max of the data. */
  domain?: [number, number];
  unit?: string;
  formatNumber?: (value: number) => string;
};

export type DateRangeFilterDef<Row> = FilterDefBase & {
  type: 'dateRange';
  /** ISO date or datetime string, or Date. */
  getValue: (row: Row) => string | Date | null | undefined;
};

export type TextFilterDef<Row> = FilterDefBase & {
  type: 'text';
  getValue: (row: Row) => string | null | undefined;
  placeholder?: string;
};

export type EmptyOrFilledFilterDef<Row> = FilterDefBase & {
  type: 'emptyOrFilled';
  getValue: (row: Row) => unknown;
  filledLabel?: string;
  emptyLabel?: string;
};

// Method signatures (bivariant) so a filter typed with its own `Value` fits the `unknown`-valued union.
export type CustomFilterDef<Row, Value> = FilterDefBase & {
  type: 'custom';
  predicate(row: Row, value: Value): boolean;
  render(props: { value: Value | undefined; onChange: (value: Value | undefined) => void }): ReactNode;
};

export type FilterDef<Row> =
  | FacetsFilterDef<Row>
  | RangeFilterDef<Row>
  | DateRangeFilterDef<Row>
  | TextFilterDef<Row>
  | EmptyOrFilledFilterDef<Row>
  | CustomFilterDef<Row, unknown>;

export type FilterValueOf<Filter> = Filter extends { type: 'facets' }
  ? string[]
  : Filter extends { type: 'range' }
    ? [number, number]
    : Filter extends { type: 'dateRange' }
      ? DateRangeFilterValue
      : Filter extends { type: 'text' }
        ? string
        : Filter extends { type: 'emptyOrFilled' }
          ? 'filled' | 'empty'
          : Filter extends CustomFilterDef<infer _Row, infer Value>
            ? Value
            : never;

/** Filter values keyed by filter id; an absent or `undefined` entry means the filter is inactive. */
export type FilterValuesOf<Row, Filters extends readonly FilterDef<Row>[]> = {
  [Filter in Filters[number] as Filter['id']]?: FilterValueOf<Filter>;
};

export type FilterValues = Record<string, unknown>;
