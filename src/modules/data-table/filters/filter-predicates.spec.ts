import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import {
  applyFilters,
  areFilterValuesEqual,
  compactFilterValues,
  computeFacetOptions,
  computeRangeDomain,
  countActiveFilters,
  matchesFilter,
} from './filter-predicates';
import { EMPTY_FACET_KEY, type FilterDef } from './filter-types';

type Row = {
  name: string;
  status: string | null;
  tags: string[];
  distance: number | null;
  createdAt: string | null;
  active: boolean;
};

const rows: Row[] = [
  { active: true, createdAt: '2024-01-15T10:00:00Z', distance: 10, name: 'Élodie', status: 'open', tags: ['a', 'b'] },
  { active: false, createdAt: '2024-03-01', distance: 250, name: 'Marc', status: null, tags: [] },
  { active: true, createdAt: null, distance: null, name: 'Zoé', status: 'closed', tags: ['b'] },
];

const facets: FilterDef<Row> = { getValue: (row) => row.status, id: 'status', label: 'Statut', type: 'facets' };
const tags: FilterDef<Row> = { getValue: (row) => row.tags, id: 'tags', label: 'Tags', type: 'facets' };
const range: FilterDef<Row> = { getValue: (row) => row.distance, id: 'distance', label: 'Distance', type: 'range' };
const dateRange: FilterDef<Row> = { getValue: (row) => row.createdAt, id: 'createdAt', label: 'Créé', type: 'dateRange' };
const text: FilterDef<Row> = { getValue: (row) => row.name, id: 'name', label: 'Nom', type: 'text' };
const emptyOrFilled: FilterDef<Row> = { getValue: (row) => row.status, id: 'hasStatus', label: 'Statut', type: 'emptyOrFilled' };
const custom: FilterDef<Row> = {
  id: 'active',
  label: 'Actif',
  predicate: (row, value: boolean) => row.active === value,
  render: () => null,
  type: 'custom',
};

describe('matchesFilter', () => {
  const testCases: TestCase<[FilterDef<Row>, Row, unknown], boolean>[] = [
    { expectedOutput: true, input: [facets, rows[1], undefined], label: 'undefined value → inactive' },
    { expectedOutput: true, input: [facets, rows[0], ['open']], label: 'facets: selected key matches' },
    { expectedOutput: false, input: [facets, rows[0], ['closed']], label: 'facets: unselected key rejects' },
    { expectedOutput: true, input: [facets, rows[0], []], label: 'facets: empty selection matches everything' },
    { expectedOutput: true, input: [facets, rows[1], [EMPTY_FACET_KEY]], label: 'facets: null value matches the empty key' },
    { expectedOutput: true, input: [tags, rows[0], ['b']], label: 'facets: array value matches when one tag is selected' },
    { expectedOutput: true, input: [tags, rows[1], [EMPTY_FACET_KEY]], label: 'facets: empty array value matches the empty key' },
    { expectedOutput: true, input: [range, rows[0], [0, 100]], label: 'range: inside bounds' },
    { expectedOutput: false, input: [range, rows[1], [0, 100]], label: 'range: outside bounds' },
    { expectedOutput: false, input: [range, rows[2], [0, 1000]], label: 'range: null value never matches' },
    {
      expectedOutput: true,
      input: [dateRange, rows[0], { from: '2024-01-15', to: '2024-01-15' }],
      label: 'dateRange: datetime inside bounds (date part compared)',
    },
    { expectedOutput: false, input: [dateRange, rows[0], { from: '2024-02-01' }], label: 'dateRange: before from' },
    { expectedOutput: true, input: [dateRange, rows[1], { to: '2024-03-01' }], label: 'dateRange: only to bound' },
    { expectedOutput: false, input: [dateRange, rows[2], { from: '2024-01-01' }], label: 'dateRange: null excluded by default' },
    { expectedOutput: true, input: [dateRange, rows[2], { includeEmpty: true }], label: 'dateRange: null included on demand' },
    { expectedOutput: true, input: [text, rows[0], 'elo'], label: 'text: accent-insensitive substring' },
    { expectedOutput: false, input: [text, rows[0], 'marc'], label: 'text: no match' },
    { expectedOutput: true, input: [text, rows[0], ''], label: 'text: empty query matches' },
    { expectedOutput: true, input: [emptyOrFilled, rows[0], 'filled'], label: 'emptyOrFilled: filled' },
    { expectedOutput: true, input: [emptyOrFilled, rows[1], 'empty'], label: 'emptyOrFilled: empty' },
    { expectedOutput: false, input: [emptyOrFilled, rows[1], 'filled'], label: 'emptyOrFilled: filled rejects null' },
    { expectedOutput: true, input: [custom, rows[1], false], label: 'custom: predicate' },
  ];
  it.each(testCases)('$label', ({ input: [filter, row, value], expectedOutput }) => {
    expect(matchesFilter(filter, row, value)).toStrictEqual(expectedOutput);
  });
});

describe('applyFilters', () => {
  it('returns the same array when no filter is active', () => {
    expect(applyFilters(rows, [facets, range], { distance: undefined })).toBe(rows);
  });

  it('combines active filters with AND', () => {
    expect(applyFilters(rows, [facets, range, custom], { active: true, distance: [0, 100], status: ['open', 'closed'] })).toStrictEqual([
      rows[0],
    ]);
  });
});

describe('computeFacetOptions', () => {
  it('counts occurrences, sorts alphabetically and puts the empty key last', () => {
    expect(computeFacetOptions(facets, rows)).toStrictEqual([
      { count: 1, key: 'closed' },
      { count: 1, key: 'open' },
      { count: 1, key: EMPTY_FACET_KEY },
    ]);
  });

  it('counts every element of array values', () => {
    expect(computeFacetOptions(tags, rows)).toStrictEqual([
      { count: 1, key: 'a' },
      { count: 2, key: 'b' },
      { count: 1, key: EMPTY_FACET_KEY },
    ]);
  });
});

describe('computeRangeDomain', () => {
  it('uses the data bounds ignoring nulls', () => {
    expect(computeRangeDomain(range, rows)).toStrictEqual([10, 250]);
  });

  it('prefers the declared domain', () => {
    expect(computeRangeDomain({ ...range, domain: [0, 1000] }, rows)).toStrictEqual([0, 1000]);
  });

  it('is undefined without numeric values', () => {
    expect(computeRangeDomain(range, [rows[2]])).toStrictEqual(undefined);
  });
});

describe('countActiveFilters / compactFilterValues', () => {
  it('ignores undefined entries', () => {
    expect(countActiveFilters({ a: [], b: undefined, c: 'x' })).toStrictEqual(2);
    expect(compactFilterValues({ a: [], b: undefined, c: 'x' })).toStrictEqual({ a: [], c: 'x' });
  });
});

describe('areFilterValuesEqual', () => {
  it('ignores key order and inactive entries', () => {
    expect(areFilterValuesEqual({ a: [1, 2], b: { x: 1, y: 2 } }, { a: [1, 2], b: { x: 1, y: 2 }, c: undefined })).toStrictEqual(true);
    expect(areFilterValuesEqual({ a: [1, 2] }, { a: [2, 1] })).toStrictEqual(false);
  });
});
